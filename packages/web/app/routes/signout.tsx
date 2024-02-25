import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import createClient from "openapi-fetch";
import type { paths } from "~/lib/api/v1";

export async function action({
  context,
  request: { headers },
}: ActionFunctionArgs) {
  const client = createClient<paths>({
    baseUrl: context.env.API_HOST,
    headers,
  });
  const { response } = await client.POST("/auth/signout");

  throw redirect("/login", { headers: response.headers });
}
