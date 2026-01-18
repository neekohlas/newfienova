interface ChapterDividerProps {
  date: string;
}

export default function ChapterDivider({ date }: ChapterDividerProps) {
  return (
    <div className="chapter-divider">
      <span>{date}</span>
    </div>
  );
}
