import { Playground } from "@/components/playground/Playground";

export const metadata = {
  title: "Playground · Hyoungseo Son",
  description:
    "A real-time rigid-body physics sandbox built with react-three-fiber and the Rapier engine.",
};

export default function PlaygroundPage() {
  return <Playground />;
}
