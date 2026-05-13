import { FlashcardArray } from "react-quizlet-flashcard";
import { CSSProperties } from "react";
import { useIdioms } from "../IdiomStore";

export function Cards() {
  const { idioms, loading } = useIdioms();

  const cardStyle: CSSProperties = {
    backgroundColor: "var(--card-background)",
    color: "var(--card-text)",
    display: "grid",
    justifyContent: "center",
    alignItems: "center",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "10px",
    padding: "10px",
    textAlign: "center",
    fontFamily: "Garamond, Arial, sans-serif",
    fontSize: "1.5em",
  };

  const cards = idioms.map((idiom, index) => ({
    id: index,
    frontHTML: idiom.idiom,
    backHTML: idiom.english,
  }));

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen p-4"
        aria-busy="true"
        aria-label="Loading flashcards"
      />
    );
  }

  return (
    <div className="flex justify-center items-center h-screen p-4">
      <FlashcardArray
        cards={cards}
        frontContentStyle={cardStyle}
        backContentStyle={cardStyle}
      />
    </div>
  );
}
