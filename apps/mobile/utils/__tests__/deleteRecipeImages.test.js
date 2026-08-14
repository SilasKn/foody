import { deleteRecipeImages } from '../deleteRecipeImages';

const mockRecipeId = 42;

function makeMockSupabase({
  rows = [],
  selectError = null,
  removeError = null,
  deleteError = null,
} = {}) {
  const removeMock = jest.fn().mockResolvedValue({ error: removeError });
  const eqSelectMock = jest.fn().mockResolvedValue({ data: rows, error: selectError });
  const selectMock = jest.fn().mockReturnValue({ eq: eqSelectMock });
  const eqDeleteMock = jest.fn().mockResolvedValue({ error: deleteError });
  const deleteMock = jest.fn().mockReturnValue({ eq: eqDeleteMock });

  const supabase = {
    storage: { from: jest.fn().mockReturnValue({ remove: removeMock }) },
    from: jest.fn().mockReturnValue({ select: selectMock, delete: deleteMock }),
    _removeMock: removeMock,
    _selectMock: selectMock,
    _eqSelectMock: eqSelectMock,
    _deleteMock: deleteMock,
    _eqDeleteMock: eqDeleteMock,
  };

  return supabase;
}

afterEach(() => {
  jest.clearAllMocks();
});

// Test 1: recipe has no image → no storage call, no metadata delete
test('does nothing when the recipe has no images', async () => {
  const supabase = makeMockSupabase({ rows: [] });

  await deleteRecipeImages(supabase, mockRecipeId);

  expect(supabase._selectMock).toHaveBeenCalledWith('file_path');
  expect(supabase._eqSelectMock).toHaveBeenCalledWith('recipe_id', mockRecipeId);
  expect(supabase.storage.from).not.toHaveBeenCalled();
  expect(supabase._deleteMock).not.toHaveBeenCalled();
});

// Test 2: happy path — file removed from the bucket, then metadata row deleted
test('removes the stored file and then the metadata row', async () => {
  const filePath = 'user-123/42/1717171717.jpg';
  const supabase = makeMockSupabase({ rows: [{ file_path: filePath }] });

  await deleteRecipeImages(supabase, mockRecipeId);

  expect(supabase.storage.from).toHaveBeenCalledWith('recipe_images');
  expect(supabase._removeMock).toHaveBeenCalledWith([filePath]);
  expect(supabase.from).toHaveBeenCalledWith('recipe_images');
  expect(supabase._eqDeleteMock).toHaveBeenCalledWith('recipe_id', mockRecipeId);
});

// Test 3: several rows for one recipe are removed in a single call
test('removes every file belonging to the recipe', async () => {
  const rows = [{ file_path: 'user-123/42/1.jpg' }, { file_path: 'user-123/42/2.png' }];
  const supabase = makeMockSupabase({ rows });

  await deleteRecipeImages(supabase, mockRecipeId);

  expect(supabase._removeMock).toHaveBeenCalledWith(['user-123/42/1.jpg', 'user-123/42/2.png']);
});

// Test 4: storage removal fails → throws, metadata row kept so the path stays findable
test('throws and keeps the metadata row when storage removal fails', async () => {
  const supabase = makeMockSupabase({
    rows: [{ file_path: 'user-123/42/1.jpg' }],
    removeError: new Error('storage error'),
  });

  await expect(deleteRecipeImages(supabase, mockRecipeId)).rejects.toThrow('storage error');
  expect(supabase._deleteMock).not.toHaveBeenCalled();
});

// Test 5: lookup fails → throws before touching storage
test('throws without touching storage when the lookup fails', async () => {
  const supabase = makeMockSupabase({ selectError: new Error('select error') });

  await expect(deleteRecipeImages(supabase, mockRecipeId)).rejects.toThrow('select error');
  expect(supabase.storage.from).not.toHaveBeenCalled();
});

// Test 6: metadata delete fails → throws
test('throws when deleting the metadata row fails', async () => {
  const supabase = makeMockSupabase({
    rows: [{ file_path: 'user-123/42/1.jpg' }],
    deleteError: new Error('delete error'),
  });

  await expect(deleteRecipeImages(supabase, mockRecipeId)).rejects.toThrow('delete error');
});
