<script>
  import _themes from "../data/themes.json";
  export let theme = "";

  const themes = _themes.map((theme) => {
    const elem = document.createElement("link");
    elem.rel = "stylesheet";
    elem.href = "/vendors/codemirror/theme/" + theme;
    document.head.append(elem);

    theme = theme.split(".");
    theme.pop();
    return theme.join();
  });
</script>

<div class="select is-fullwidth">
  <select bind:value={theme}>
    <option disabled selected>Select Theme</option>
    {#each themes as theme}
      <option value={theme}>{theme}</option>
    {/each}
  </select>
</div>
