import { Container, HStack, Stack } from "styled-system/jsx";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import type { paths } from "app/lib/api/v1";
import createClient from "openapi-fetch";
import { json } from "@remix-run/cloudflare";
import { Text } from "~/components/ui/text";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Checkbox } from "~/components/ui/checkbox";
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Pencil, Plus, Save, Trash } from "lucide-react";
import { IconButton } from "~/components/ui/icon-button";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Todo App" },
    { name: "description", content: "Welcome to Todo App!" },
  ];
};

const client = createClient<paths>({
  baseUrl: "https://shy-butterfly-78ad.chiji.workers.dev/",
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  console.log("formData: ", formData);
  switch (formData.get("action")) {
    case "Add": {
      const title = formData.get("title");
      if (!title || title.toString() === "") return null;
      const { error } = await client.POST("/todos", {
        body: { title: title.toString() },
      });
      if (error) return null;
      return json({ ok: true });
    }
    case "Check": {
      const completed = formData.get("completed");
      const id = formData.get("id");
      if (!id) return null;
      if (completed?.toString() === "true") {
        const { error } = await client.PATCH("/todos/{id}", {
          params: { path: { id: id.toString() } },
          body: {
            completed: true,
          },
        });
        if (error) return null;
        return json({ ok: true });
      } else if (completed?.toString() === "false") {
        const { error } = await client.PATCH("/todos/{id}", {
          params: { path: { id: id.toString() } },
          body: {
            completed: false,
          },
        });
        if (error) return null;
        return json({ ok: true });
      }
      return null;
    }
    case "Delete": {
      const id = formData.get("id");
      if (!id) return null;
      const { error } = await client.DELETE("/todos/{id}", {
        params: { path: { id: id.toString() } },
      });
      if (error) return null;
      return json({ ok: true });
    }
    case "Edit": {
      const id = formData.get("id");
      if (!id) return null;
      const title = formData.get("title");
      if (!title) return null;
      const { error } = await client.PATCH("/todos/{id}", {
        params: { path: { id: id.toString() } },
        body: {
          title: title.toString(),
        },
      });
      if (error) return null;
      return json({ ok: true });
    }
    default: {
      return null;
    }
  }
}

export async function loader() {
  const { data, error } = await client.GET("/todos");
  if (error) throw error;
  return json(data);
}

export default function TodosRoute() {
  const todos = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isPresent = useIsPresent();
  const [input, setInput] = useState<string>("");
  const [isEditing, setEditing] = useState<number | null>(null);

  const isAdding = fetcher.state !== "idle" && fetcher.formMethod === "POST";
  const isDeleting =
    fetcher.state !== "idle" && fetcher.formMethod === "DELETE";
  const isEditingSubmitting =
    fetcher.state !== "idle" &&
    fetcher.formMethod === "PATCH" &&
    fetcher.formData?.get("title") !== null;

  return (
    <Container maxW={"xl"} mt={"16"}>
      <Stack gap={"6"}>
        <Text size={"3xl"}>Todos</Text>

        <Stack gap={"2"}>
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div
                layout
                key={todo?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 900, damping: 40 }}
                style={{ position: isPresent ? "static" : "absolute" }}
              >
                <HStack justify={"space-between"}>
                  <fetcher.Form>
                    <Checkbox
                      checked={todo?.completed}
                      onCheckedChange={(e) => {
                        fetcher.submit(
                          {
                            id: todo!.id,
                            completed: e.checked,
                            action: "Check",
                          },
                          { method: "PATCH" }
                        );
                      }}
                      disabled={isDeleting}
                    >
                      {isEditing === todo!.id ? (
                        <Input
                          defaultValue={todo?.title}
                          onFocus={() => {
                            setInput(todo!.title);
                          }}
                          onChange={(e) => {
                            setInput(e.currentTarget.value);
                          }}
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                        />
                      ) : isEditingSubmitting &&
                        fetcher.formData?.get("id")?.toString() ===
                          todo?.id.toString() ? (
                        fetcher.formData?.get("title")?.toString()
                      ) : (
                        todo?.title
                      )}
                    </Checkbox>
                  </fetcher.Form>
                  <HStack>
                    {isEditing === todo?.id ? (
                      <fetcher.Form>
                        <IconButton
                          size={"sm"}
                          disabled={isDeleting}
                          onClick={() => {
                            setEditing(null);
                            fetcher.submit(
                              { action: "Edit", id: todo!.id, title: input },
                              { method: "PATCH" }
                            );
                          }}
                        >
                          <Save />
                        </IconButton>
                      </fetcher.Form>
                    ) : (
                      <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        disabled={isDeleting}
                        onClick={() => {
                          setEditing(todo!.id);
                        }}
                      >
                        <Pencil />
                      </IconButton>
                    )}

                    <fetcher.Form method="delete">
                      <Input type="hidden" name="action" value="Delete" />
                      <Input type="hidden" name="id" value={todo!.id} />
                      <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        type="submit"
                        disabled={isDeleting}
                      >
                        <Trash />
                      </IconButton>
                    </fetcher.Form>
                  </HStack>
                </HStack>
              </motion.div>
            ))}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 900, damping: 40 }}
            >
              <fetcher.Form method="post">
                <HStack mt={6}>
                  <Input id="title" placeholder="New Todo" name="title" />
                  <Button
                    type="submit"
                    disabled={isAdding}
                    minW={"min-content"}
                    name="action"
                    value="Add"
                  >
                    {isAdding ? "Saving..." : "Add"}
                    <Plus />
                  </Button>
                </HStack>
              </fetcher.Form>
            </motion.div>
          </AnimatePresence>
        </Stack>
      </Stack>
    </Container>
  );
}
