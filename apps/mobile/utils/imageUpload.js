export async function uploadImage(supabase, user, recipeId, selectedImage) {
  if (!selectedImage) return;
  const ext = (selectedImage.uri.split('.').pop()?.split('?')[0] ?? 'jpg').toLowerCase();
  const filePath = `${user.id}/${recipeId}/${Date.now()}.${ext}`;

  const response = await fetch(selectedImage.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('recipe_images')
    .upload(filePath, arrayBuffer, { contentType: `image/${ext}` });
  if (uploadError) throw uploadError;

  const { error: metaError } = await supabase.from('recipe_images').insert({
    user_id: user.id,
    file_path: filePath,
    bucket: 'recipe_images',
    recipe_id: recipeId,
    width: selectedImage.width,
    height: selectedImage.height,
  });
  if (metaError) throw metaError;
}
