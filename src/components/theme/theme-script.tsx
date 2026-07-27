import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Applies `.dark` before paint from localStorage preference.
 * Missing/unknown → light (app default). `system` → OS preference.
 */
const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k);var dark;if(p==="dark"){dark=true;}else if(p==="system"){dark=window.matchMedia("(prefers-color-scheme: dark)").matches;}else{dark=false;}var r=document.documentElement;if(dark){r.classList.add("dark");r.style.colorScheme="dark";}else{r.classList.remove("dark");r.style.colorScheme="light";}}catch(e){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}})();`;

export function ThemeScript() {
  return (
    <script
      id="theme-init"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
