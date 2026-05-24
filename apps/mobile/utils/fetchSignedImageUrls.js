import { supabase } from './supabase';

export async function fetchSignedImageUrls(recipeIds) {
  if (!recipeIds.length) return {};

  const { data: imgRows } = await supabase
    .from('recipe_images')
    .select('recipe_id, file_path')
    .in('recipe_id', recipeIds);

  const pathMap = Object.fromEntries((imgRows ?? []).map((r) => [r.recipe_id, r.file_path]));
  const filePaths = Object.values(pathMap);
  if (!filePaths.length) return {};

  const { data: signed } = await supabase.storage
    .from('recipe_images')
    .createSignedUrls(filePaths, 3600);

  const signedMap = {};
  (signed ?? []).forEach((s) => {
    const recipeId = Object.keys(pathMap).find((id) => pathMap[id] === s.path);
    if (recipeId && s.signedUrl) signedMap[recipeId] = s.signedUrl;
  });

  return signedMap;
}
