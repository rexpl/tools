export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:html', (html) => {
        html.head.push(`<script>(function () {
            const key = "theme";
            const saved = localStorage.getItem(key);
            
            const isDark = saved !== null 
                ? saved === "dark"
                : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            
            if (isDark) {
                document.documentElement.classList.add('dark');
            }
        })();</script>`.replace(/\s+/g, " "));
    });
});