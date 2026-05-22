import i18n from "i18next";

export default function LanguageSwitcher() {

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    console.log("Language Changed:", lng);
  };

  return (
    <div className="flex items-center gap-2">
      
      <button
        onClick={() => changeLanguage("en")}
        className="rounded-md border px-2 py-1 text-sm"
      >
        EN
      </button>

      <button
        onClick={() => changeLanguage("hi")}
        className="rounded-md border px-2 py-1 text-sm"
      >
        हिंदी
      </button>

      <button
        onClick={() => changeLanguage("ta")}
        className="rounded-md border px-2 py-1 text-sm"
      >
        தமிழ்
      </button>

    </div>
  );
}