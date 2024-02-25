import { Box, Center, Container, Stack } from "styled-system/jsx";
import { Text } from "~/components/ui/text";
import type { ExternalScriptsHandle } from "remix-utils/external-scripts";
import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const handle: ExternalScriptsHandle = {
  scripts: [
    {
      src: "https://accounts.google.com/gsi/client",
      async: true,
    },
  ],
};

// declare global {
//   interface Window {
//     handleToken: (response: { credential: string }) => Promise<void>;
//   }
// }

// async function handleToken(response: { credential: string }) {
//   console.log("login");
//   const res = await fetch("http://localhost:8787/auth-receiver", {
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       idToken: response.credential,
//     }),
//   });
//   const data = await res.json();
//   console.log(data);
// }

export async function loader({ context }: LoaderFunctionArgs) {
  const { API_HOST, GOOGLE_CLIENT_ID } = context.env;
  return json({ API_HOST, GOOGLE_CLIENT_ID });
}

export default function LoginRoute() {
  //   useEffect(() => {
  //     window.handleToken = handleToken;
  //     console.log("useEffect");
  //   }, []);

  const { API_HOST, GOOGLE_CLIENT_ID } = useLoaderData<typeof loader>();

  return (
    <Container maxW={"xl"}>
      <Center>
        <Stack gap={24}>
          <Text size={"2xl"} mt={"48"} mx={"auto"}>
            Welcome to Todo App
          </Text>
          <Box mx={"auto"}>
            <div
              id="g_id_onload"
              data-client_id={GOOGLE_CLIENT_ID}
              data-context="use"
              data-ux_mode="redirect"
              data-login_uri={`${API_HOST}/auth/google`}
              data-auto_select="true"
              data-itp_support="true"
            ></div>

            <div
              className="g_id_signin"
              data-type="standard"
              data-shape="rectangular"
              data-theme="outline"
              data-text="continue_with"
              data-size="large"
              data-logo_alignment="center"
            ></div>
          </Box>
          {/* <div
            id="g_id_onload"
            data-client_id="305613596596-11ln0ibm98mj5896sapfdfeb95j8fpi7.apps.googleusercontent.com"
            data-context="use"
            data-ux_mode="popup"
            data-callback="handleToken"
            data-auto_select="true"
            data-itp_support="true"
          ></div>

          <div
            className="g_id_signin"
            data-type="standard"
            data-shape="rectangular"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left"
          ></div> */}
        </Stack>
      </Center>
    </Container>
  );
}

export const GoogleAuth = () => {
  return (
    <>
      <div
        id="g_id_onload"
        data-client_id="305613596596-11ln0ibm98mj5896sapfdfeb95j8fpi7.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleToken"
        data-auto_select="true"
        data-itp_support="true"
      ></div>
      <script src="https://accounts.google.com/gsi/client" async></script>
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
    </>
  );
};
