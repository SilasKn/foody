import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "recipe_images";
const PAGE = 100;

// storage.list() ist nicht rekursiv; Pseudo-Ordner haben id === null
async function listPrefix(admin: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) out.push(...(await listPrefix(admin, path)));
      else out.push(path);
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

// Alle Uploads liegen unter <userId>/ (apps/mobile/utils/imageUpload.js), daher ist
// der Bucket-Prefix die vollstaendige Quelle - auch fuer Dateien ohne Metadatenzeile.
async function removeUserImages(admin: any, userId: string) {
  const paths = await listPrefix(admin, userId);
  for (let i = 0; i < paths.length; i += PAGE) {
    const { error } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + PAGE));
    if (error) throw error;
  }

  const leftover = await listPrefix(admin, userId);
  if (leftover.length) {
    throw new Error(`${leftover.length} Objekt(e) verblieben unter ${userId}/`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userId = user.id;

  try {
    // Muss vor deleteUser laufen: danach sind die Bilder nur noch ueber den Bucket auffindbar.
    await removeUserImages(adminClient, userId);

    // Cascade auf auth.users raeumt profiles, recipes, recipe_ingredients,
    // recipe_schedule und recipe_images ab.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
  } catch (e) {
    // Konto bleibt bestehen, damit der Nutzer es erneut versuchen kann.
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
