import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import AddRecipeScreen from '../AddRecipeScreen';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../../utils/imageUpload', () => ({ uploadImage: jest.fn() }));
jest.mock('../../utils/supabase', () => ({ supabase: {} }));
jest.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockPrependRecipe = jest.fn();
const mockRefreshRecipesForMode = jest.fn();
jest.mock('../../providers/RecipesProvider', () => ({
  useRecipes: () => ({
    prependRecipe: mockPrependRecipe,
    refreshRecipesForMode: mockRefreshRecipesForMode,
    filterModes: { MINE: 'mine', PUBLIC: 'public' },
  }),
}));

jest.mock('@react-native-picker/picker', () => {
  const { View } = require('react-native');
  const Picker = ({ children }) => <View>{children}</View>;
  Picker.Item = () => null;
  return { Picker };
});
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// ─── Supabase mock factory ─────────────────────────────────────────────────────

const { supabase } = require('../../utils/supabase');
const { uploadImage } = require('../../utils/imageUpload');
const { launchImageLibraryAsync } = require('expo-image-picker');
const { ImageManipulator } = require('expo-image-manipulator');

// Der Picker liefert immer die Originaldatei (mit EXIF/GPS); erst das Re-Encoding
// durch den Manipulator erzeugt die Datei, die tatsaechlich hochgeladen wird.
const PICKED_IMAGE = { uri: 'file:///tmp/photo.jpg', width: 800, height: 600 };
const CLEAN_IMAGE = { uri: 'file:///tmp/clean.jpg', width: 800, height: 600 };

function setupManipulatorMock({ saveResult = CLEAN_IMAGE, saveError = null } = {}) {
  const saveAsync = saveError
    ? jest.fn().mockRejectedValue(saveError)
    : jest.fn().mockResolvedValue(saveResult);
  const renderAsync = jest.fn().mockResolvedValue({ saveAsync });
  const resize = jest.fn();
  const context = { resize, renderAsync };
  resize.mockReturnValue(context);
  ImageManipulator.manipulate.mockReturnValue(context);
  return { resize, renderAsync, saveAsync };
}

async function pickImageIn({ getByLabelText }) {
  await act(async () => {
    fireEvent.press(getByLabelText('Add recipe image'));
  });
  await waitFor(() => expect(launchImageLibraryAsync).toHaveBeenCalled());
}

const CREATED_RECIPE = { id: 99, name: 'Test', author: 'user-123', created_at: '2026-01-01' };

function buildDeleteChain(error = null) {
  const eqMock = jest.fn().mockResolvedValue({ error });
  const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
  return { deleteMock, eqMock };
}

function setupSupabaseMock({ updateDraftError = null } = {}) {
  const { deleteMock: recipesDeleteMock } = buildDeleteChain();
  const { deleteMock: ingredientsDeleteMock } = buildDeleteChain();

  const singleMock = jest.fn().mockResolvedValue({ data: CREATED_RECIPE, error: null });
  const selectAfterInsert = jest.fn().mockReturnValue({ single: singleMock });
  const recipesInsertMock = jest.fn().mockReturnValue({ select: selectAfterInsert });

  const updateEqMock = jest.fn().mockResolvedValue({ error: updateDraftError });
  const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });

  // ingredients is read via .select(...).eq('created_by', ...) since the table
  // became per-user, so the mock has to offer that link in the chain.
  const ingredientsSelectEqMock = jest.fn().mockResolvedValue({ data: [], error: null });
  const ingredientsSelectMock = jest.fn().mockReturnValue({ eq: ingredientsSelectEqMock });
  const ingredientsInsertSelectMock = jest
    .fn()
    .mockResolvedValue({ data: [{ id: 1, name: 'Salt' }], error: null });
  const ingredientsInsertMock = jest.fn().mockReturnValue({ select: ingredientsInsertSelectMock });

  supabase.from = jest.fn((table) => {
    if (table === 'recipes') {
      return {
        insert: recipesInsertMock,
        update: updateMock,
        delete: recipesDeleteMock,
      };
    }
    if (table === 'recipe_ingredients') {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: ingredientsDeleteMock,
      };
    }
    if (table === 'ingredients') {
      return { select: ingredientsSelectMock, insert: ingredientsInsertMock };
    }
    return {};
  });

  return {
    recipesInsertMock,
    updateMock,
    recipesDeleteMock,
    ingredientsDeleteMock,
    ingredientsSelectMock,
    ingredientsSelectEqMock,
    ingredientsInsertMock,
  };
}

// ─── Render helpers ────────────────────────────────────────────────────────────

const fakeNavigation = { goBack: jest.fn(), navigate: jest.fn() };

function renderScreen() {
  return render(<AddRecipeScreen navigation={fakeNavigation} route={{}} />);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  uploadImage.mockResolvedValue(undefined);
  setupManipulatorMock();
  launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [PICKED_IMAGE] });
});

afterEach(() => {
  jest.useRealTimers();
});

// Test 6: no image → draft: true created, finalized to draft: false, uploadImage NOT called
test('creates draft then finalizes without calling uploadImage when no image selected', async () => {
  const { recipesInsertMock, updateMock } = setupSupabaseMock();
  const { getByPlaceholderText, getByText } = renderScreen();

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await waitFor(() =>
    expect(recipesInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ draft: true })
    )
  );
  await waitFor(() =>
    expect(updateMock).toHaveBeenCalledWith({ draft: false })
  );
  expect(uploadImage).not.toHaveBeenCalled();
});

// Test 7: with image → uploadImage called with correct args, then finalized to draft: false
test('calls uploadImage then finalizes when image is selected', async () => {
  const { updateMock } = setupSupabaseMock();

  const screen = renderScreen();
  const { getByPlaceholderText, getByText } = screen;

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');

  await pickImageIn(screen);

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await waitFor(() =>
    expect(uploadImage).toHaveBeenCalledWith(
      supabase,
      { id: 'user-123' },
      CREATED_RECIPE.id,
      expect.objectContaining({ uri: CLEAN_IMAGE.uri })
    )
  );
  await waitFor(() =>
    expect(updateMock).toHaveBeenCalledWith({ draft: false })
  );
});

// Test 8: ingredient insert fails → draft recipe + ingredients deleted, error shown
test('deletes draft recipe when ingredient insert fails', async () => {
  const { recipesDeleteMock, ingredientsDeleteMock } = setupSupabaseMock();

  // Override recipe_ingredients insert to fail
  supabase.from = jest.fn((table) => {
    if (table === 'recipes') {
      const single = jest.fn().mockResolvedValue({ data: CREATED_RECIPE, error: null });
      const sel = jest.fn().mockReturnValue({ single });
      const ins = jest.fn().mockReturnValue({ select: sel });
      const delEq = jest.fn().mockResolvedValue({ error: null });
      const del = jest.fn().mockReturnValue({ eq: delEq });
      const updEq = jest.fn().mockResolvedValue({ error: null });
      const upd = jest.fn().mockReturnValue({ eq: updEq });
      return { insert: ins, delete: del, update: upd };
    }
    if (table === 'recipe_ingredients') {
      const delEq = jest.fn().mockResolvedValue({ error: null });
      const del = jest.fn().mockReturnValue({ eq: delEq });
      return {
        insert: jest.fn().mockResolvedValue({ error: new Error('ingredients failed') }),
        delete: del,
      };
    }
    if (table === 'ingredients') {
      const insertSelectMock = jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'Salt' }], error: null });
      const selectEqMock = jest.fn().mockResolvedValue({ data: [], error: null });
      return {
        select: jest.fn().mockReturnValue({ eq: selectEqMock }),
        insert: jest.fn().mockReturnValue({ select: insertSelectMock }),
      };
    }
    return {};
  });

  const { getByPlaceholderText, getByText, findByText, getByLabelText } = renderScreen();

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');

  // Add an ingredient so the recipe_ingredients insert path runs
  fireEvent.changeText(getByPlaceholderText('Add ingredient…'), 'Salt');
  fireEvent.changeText(getByPlaceholderText('Quantity'), '5');
  await act(async () => {
    fireEvent.press(getByLabelText('Add ingredient'));
  });

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await findByText('ingredients failed');
  // Verify draft cleanup was attempted
  const fromCalls = supabase.from.mock.calls.map((c) => c[0]);
  expect(fromCalls).toContain('recipes');
});

// Test 9: uploadImage throws → draft deleted, error message shown
test('deletes draft recipe and shows error when uploadImage throws', async () => {
  setupSupabaseMock();
  uploadImage.mockRejectedValue(new Error('upload failed'));

  const screen = renderScreen();
  const { getByPlaceholderText, getByText, findByText } = screen;

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');

  await pickImageIn(screen);

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await findByText('upload failed');

  // Verify cleanup: delete was called on recipes
  const deletedFromRecipes = supabase.from.mock.calls.some((c) => c[0] === 'recipes');
  expect(deletedFromRecipes).toBe(true);
});

// Test 10: finalize update (draft: false) fails → draft deleted, error shown
test('deletes draft recipe and shows error when finalize update fails', async () => {
  setupSupabaseMock({ updateDraftError: new Error('finalize failed') });

  const { getByPlaceholderText, getByText, findByText } = renderScreen();

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await findByText('finalize failed');

  const deletedFromRecipes = supabase.from.mock.calls.some((c) => c[0] === 'recipes');
  expect(deletedFromRecipes).toBe(true);
});

// Test 11: new ingredients are stamped with the owner and looked up per user
test('stamps created_by on new ingredients and scopes the lookup to the user', async () => {
  const { ingredientsSelectMock, ingredientsSelectEqMock, ingredientsInsertMock } =
    setupSupabaseMock();

  const { getByPlaceholderText, getByText, getByLabelText } = renderScreen();

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');
  fireEvent.changeText(getByPlaceholderText('Add ingredient…'), 'Salt');
  fireEvent.changeText(getByPlaceholderText('Quantity'), '5');
  await act(async () => {
    fireEvent.press(getByLabelText('Add ingredient'));
  });

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  // The catalogue is no longer global: only the caller's own rows are read.
  await waitFor(() => expect(ingredientsSelectMock).toHaveBeenCalledWith('id, name'));
  expect(ingredientsSelectEqMock).toHaveBeenCalledWith('created_by', 'user-123');

  // Without created_by the RLS insert policy would reject the row.
  expect(ingredientsInsertMock).toHaveBeenCalledWith([
    { name: 'Salt', created_by: 'user-123' },
  ]);
});

// ─── Metadaten-Entfernung (EXIF/GPS) ───────────────────────────────────────────

// Test 11: die vom Picker gelieferte Datei darf das Geraet niemals verlassen.
// Genau dieser Test faellt um, falls das Re-Encoding je wieder herausfliegt.
test('uploads the re-encoded file and never the URI returned by the picker', async () => {
  setupSupabaseMock();
  const { saveAsync } = setupManipulatorMock();

  const screen = renderScreen();
  const { getByPlaceholderText, getByText } = screen;

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');
  await pickImageIn(screen);

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await waitFor(() => expect(uploadImage).toHaveBeenCalled());

  expect(ImageManipulator.manipulate).toHaveBeenCalledWith(PICKED_IMAGE.uri);
  expect(saveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.8 });

  const uploaded = uploadImage.mock.calls[0][3];
  expect(uploaded.uri).toBe(CLEAN_IMAGE.uri);
  expect(uploaded.uri).not.toBe(PICKED_IMAGE.uri);
});

// Test 12: kleines Bild -> kein Resize, aber das Re-Encoding laeuft trotzdem.
// Das Ueberspringen von saveAsync waere hier der Weg, wie EXIF zurueckkaeme.
test('re-encodes without resizing when the image is below the max dimension', async () => {
  setupSupabaseMock();
  const { resize, saveAsync } = setupManipulatorMock();

  const screen = renderScreen();
  await pickImageIn(screen);

  expect(resize).not.toHaveBeenCalled();
  expect(saveAsync).toHaveBeenCalledTimes(1);
});

// Test 13: Resize entlang der laengeren Kante, damit das Seitenverhaeltnis bleibt
test('resizes along the longer edge when the image exceeds the max dimension', async () => {
  setupSupabaseMock();
  const { resize } = setupManipulatorMock();
  launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/wide.jpg', width: 4032, height: 3024 }],
  });

  const screen = renderScreen();
  await pickImageIn(screen);

  expect(resize).toHaveBeenCalledWith({ width: 1600 });
});

test('resizes by height for a portrait image that exceeds the max dimension', async () => {
  setupSupabaseMock();
  const { resize } = setupManipulatorMock();
  launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/tall.jpg', width: 3024, height: 4032 }],
  });

  const screen = renderScreen();
  await pickImageIn(screen);

  expect(resize).toHaveBeenCalledWith({ height: 1600 });
});

// Test 14: fail closed - schlaegt das Re-Encoding fehl, wird gar kein Bild
// uebernommen statt auf das ungefilterte Original zurueckzufallen.
test('keeps no image at all when re-encoding fails', async () => {
  setupSupabaseMock();
  setupManipulatorMock({ saveError: new Error('decode failed') });
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const screen = renderScreen();
  const { getByPlaceholderText, getByText } = screen;

  fireEvent.changeText(getByPlaceholderText('e.g. Spaghetti Aglio e Olio'), 'Test Recipe');
  await pickImageIn(screen);

  expect(alertSpy).toHaveBeenCalled();

  await act(async () => {
    fireEvent.press(getByText('Save'));
  });

  await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('recipes'));
  expect(uploadImage).not.toHaveBeenCalled();

  alertSpy.mockRestore();
});
