import { useLocale } from "@nuxt/ui/composables/useLocale";

const messages = {
  en: {
    parameters: "Course parameters", onStep: "On this step", sections: "sections",
    content: "Course content", instructions: "Work through the required steps in order or open any lesson directly.",
    progress: "Your progress", completed: "{done} of {total} steps completed", requiredProgress: "Required course progress",
    structure: "Course structure", required: "required", optional: "optional", duration: "Estimated duration",
    unspecified: "Not specified", estimated: "Estimated", done: "Completed", hours: "hr",
    review: "Review course", resume: "Continue course", start: "Start course", overview: "Course overview",
    outline: "Course outline", position: "Step {current} of {total}", requiredSteps: "{done} of {total} required steps",
    updated: "Updated", draft: "Draft", stepDone: "Step completed", markDone: "Mark step complete",
    resize: "Resize file tree"
  },
  de: {
    parameters: "Kursparameter", onStep: "In dieser Lektion", sections: "Abschnitte",
    content: "Kursinhalt", instructions: "Bearbeite die Pflichtlektionen der Reihe nach oder öffne eine Lektion direkt.",
    progress: "Dein Fortschritt", completed: "{done} von {total} Lernschritten abgeschlossen", requiredProgress: "Fortschritt im Pflichtteil",
    structure: "Kursaufbau", required: "verpflichtend", optional: "optional", duration: "Geschätzte Gesamtdauer",
    unspecified: "Keine Angabe", estimated: "ca.", done: "Abgeschlossen", hours: "Std.",
    review: "Kurs wiederholen", resume: "Kurs fortsetzen", start: "Kurs starten", overview: "Kursübersicht",
    outline: "Kursübersicht", position: "Lektion {current} von {total}", requiredSteps: "{done} von {total} Pflichtschritten",
    updated: "Aktualisiert am", draft: "Entwurf", stepDone: "Lektion abgeschlossen", markDone: "Lektion abschließen",
    resize: "Breite des Dateibaums ändern"
  }
} as const;

/** Follow UApp's locale without requiring a separate i18n module. */
export function useCourseLabels() {
  const { code } = useLocale();
  return (key: keyof typeof messages.en, values: Record<string, string | number> = {}): string => {
    const language = code.value.toLowerCase().split("-")[0] === "de" ? "de" : "en";
    return messages[language][key].replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
  };
}
