import { uploadImage } from '../imageUpload';

const mockUser = { id: 'user-123' };
const mockRecipeId = 42;
const mockImage = { uri: 'file:///tmp/photo.jpg', width: 800, height: 600 };

const mockBlob = {};
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeMockSupabase({ uploadError = null, insertError = null } = {}) {
  const insertMock = jest.fn().mockResolvedValue({ error: insertError });
  const uploadMock = jest.fn().mockResolvedValue({ error: uploadError });
  const fromStorageMock = jest.fn().mockReturnValue({ upload: uploadMock });
  const fromTableMock = jest.fn().mockReturnValue({ insert: insertMock });

  const supabase = {
    storage: { from: fromStorageMock },
    // from() must return different objects depending on table name
    from: jest.fn((name) => (name === 'recipe_images' ? { insert: insertMock } : {})),
    _uploadMock: uploadMock,
    _insertMock: insertMock,
    _fromStorageMock: fromStorageMock,
  };
  // Wire storage.from to return uploadMock
  supabase.storage.from = jest.fn().mockReturnValue({ upload: uploadMock });

  return supabase;
}

beforeEach(() => {
  mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
});

afterEach(() => {
  jest.clearAllMocks();
});

// Test 1: no-op when selectedImage is null
test('returns without calling supabase when selectedImage is null', async () => {
  const supabase = makeMockSupabase();
  await uploadImage(supabase, mockUser, mockRecipeId, null);
  expect(supabase.storage.from).not.toHaveBeenCalled();
  expect(supabase.from).not.toHaveBeenCalled();
});

// Test 2: happy path — correct bucket, path pattern, metadata fields
test('uploads file and inserts metadata on success', async () => {
  const supabase = makeMockSupabase();

  await uploadImage(supabase, mockUser, mockRecipeId, mockImage);

  expect(global.fetch).toHaveBeenCalledWith(mockImage.uri);

  expect(supabase.storage.from).toHaveBeenCalledWith('recipe_images');
  const [filePath, , options] = supabase._uploadMock.mock.calls[0];
  expect(filePath).toMatch(new RegExp(`^${mockUser.id}/${mockRecipeId}/\\d+\\.jpg$`));
  expect(options).toEqual({ contentType: 'image/jpg' });

  expect(supabase.from).toHaveBeenCalledWith('recipe_images');
  const insertedData = supabase._insertMock.mock.calls[0][0];
  expect(insertedData).toMatchObject({
    user_id: mockUser.id,
    file_path: filePath,
    bucket: 'recipe_images',
    recipe_id: mockRecipeId,
    width: mockImage.width,
    height: mockImage.height,
  });
});

// Test 3: storage upload fails → throws, metadata insert never called
test('throws and skips metadata insert when storage upload fails', async () => {
  const storageError = new Error('storage error');
  const supabase = makeMockSupabase({ uploadError: storageError });

  await expect(uploadImage(supabase, mockUser, mockRecipeId, mockImage)).rejects.toThrow('storage error');
  expect(supabase._insertMock).not.toHaveBeenCalled();
});

// Test 4: metadata insert fails → throws
test('throws when recipe_images metadata insert fails', async () => {
  const metaError = new Error('insert error');
  const supabase = makeMockSupabase({ insertError: metaError });

  await expect(uploadImage(supabase, mockUser, mockRecipeId, mockImage)).rejects.toThrow('insert error');
});

// Test 5: URI with query string — extension extracted correctly
test('extracts file extension correctly from URI with query string', async () => {
  const supabase = makeMockSupabase();
  const imageWithQuery = { ...mockImage, uri: 'file:///cache/photo.png?token=abc123' };

  await uploadImage(supabase, mockUser, mockRecipeId, imageWithQuery);

  const [filePath] = supabase._uploadMock.mock.calls[0];
  expect(filePath).toMatch(/\.png$/);
});
