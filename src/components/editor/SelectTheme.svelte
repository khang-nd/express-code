<script>
  import _themes from "../../data/themes.json";
  import { toCamelCase } from "../../utils/string";
  import { afterUpdate } from "svelte";
  import { get, set } from "local-storage";

  export let theme = get("theme") || "";
  afterUpdate(() => set("theme", theme));

  const themes = _themes.map((theme) => {
    const elem = document.createElement("link");
    elem.rel = "stylesheet";
    elem.href = "vendors/codemirror/theme/" + theme;
    document.head.append(elem);

    theme = theme.split(".");
    theme.pop();
    return theme.join();
  });
</script>

<div class="field">
  <p class="control has-icons-left">
    <span class="select is-fullwidth">
      <select bind:value={theme}>
        <option disabled selected>Select Theme</option>
        {#each themes as theme}
          <option value={theme}>{toCamelCase(theme)}</option>
        {/each}
      </select>
    </span>
    <span class="icon is-left">
      <i class="mdi mdi-format-paint mdi-24px" />
    </span>
  </p>
</div>
