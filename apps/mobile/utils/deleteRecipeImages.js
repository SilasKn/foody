// Muss vor dem Loeschen des Rezepts laufen: der Cascade auf recipes raeumt die
// recipe_images-Zeilen ab, danach sind die Dateipfade nicht mehr auffindbar.
export async function deleteRecipeImages(supabase, recipeId) {
  const { data, error } = await supabase
    .from('recipe_images')
    .select('file_path')
    .eq('recipe_id', recipeId);
  if (error) throw error;

  const paths = (data ?? []).map((row) => row.file_path);
  if (!paths.length) return;

  const { error: removeError } = await supabase.storage.from('recipe_images').remove(paths);
  if (removeError) throw removeError;

  const { error: metaError } = await supabase
    .from('recipe_images')
    .delete()
    .eq('recipe_id', recipeId);
  if (metaError) throw metaError;
}
