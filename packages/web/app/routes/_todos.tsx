import { LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import createClient from "openapi-fetch";
import { HStack, Stack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import type { paths } from "~/lib/api/v1";

export async function loader({
  request: { headers },
  context,
}: LoaderFunctionArgs) {
  const client = createClient<paths>({
    baseUrl: context.env.API_HOST,
    headers,
  });
  const { data: currentUser } = await client.GET("/auth/me");
  console.log("currentUser: ", currentUser);
  if (!currentUser) throw redirect("/login");
  return json(currentUser);
}

export default function Header() {
  const currentUser = useLoaderData<typeof loader>();

  return (
    <Stack padding={6}>
      <HStack justifyContent={"space-between"}>
        <Text>{currentUser.name}</Text>
        <Form method="post" action="/signout">
          <Button type="submit">ログアウト</Button>
        </Form>
      </HStack>
      <Outlet />
    </Stack>
  );
}
