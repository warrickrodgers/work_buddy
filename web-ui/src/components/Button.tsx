// src/components/Button.tsx
import { Button } from "./ui/button";
import { FC } from "react";

const MyButton: FC = () => {
  return (
    <Button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
      Click Me
    </Button>
  );
};

export default MyButton;