import { Box, Container, Stack } from "styled-system/jsx";
import { graphql } from "backend/src/gql";
import { request, gql } from "graphql-request";

export async function loader() {
  await request("http://localhost:8787");
  const CREATE_TODO = graphql`
    query Create
  `;
}

export default function TodosRoute() {
  return (
    <Container>
      <Stack>
        <Box fontSize={"2xl"} fontWeight={"bold"}>
          Todos
        </Box>
        <Stack gap={"6"}>
          <Box>
            <input type="checkbox" />
            <span>Item 1</span>
          </Box>
          <Box>
            <input type="checkbox" />
            <span>Item 2</span>
          </Box>
          <Box>
            <input type="checkbox" />
            <span>Item 3</span>
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
