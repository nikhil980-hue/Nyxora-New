export default function ThinkingIndicator({
  text = "Nyxora AI is thinking...",
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>

      <span
        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
        style={{
          animationDelay: "0.2s",
        }}
      ></span>

      <span
        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
        style={{
          animationDelay: "0.4s",
        }}
      ></span>

      <span className="ml-3 text-sm text-gray-400">
        {text}
      </span>
    </div>
  );
}
