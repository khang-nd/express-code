<script>
  import _snippets from "../data/snippets.json";
  import themes from "../data/themes.json";
  import { onMount } from "svelte";

  const snippets = _snippets.filter(
    (snippet) => !/JohnDoe/.test(snippet.author)
  );
  const colors = [
    "black",
    "dark",
    "primary",
    "link",
    "link-dark",
    "info",
    "info-dark",
    "success",
    "success-dark",
    "warning-dark",
    "danger",
    "danger-dark",
  ];

  let textareas = [];

  function r(max) {
    const { round, random } = Math;
    return round(random() * (max - 1));
  }

  onMount(() => {
    textareas.forEach((textarea, i) => {
      let theme = themes[r(themes.length)];
      theme = theme.split(".");
      theme.pop();
      const { mode } = CodeMirror.findModeByExtension(snippets[i].extension);
      const cm = new CodeMirror(textarea, {
        lineNumbers: true,
        theme: theme.join(),
        readOnly: true,
        value: snippets[i].content,
        mode,
      });
      CodeMirror.autoLoadMode(cm, mode);
    });
  });
</script>

<style>
  .column {
    position: relative;
  }

  .author {
    position: absolute;
    top: -6px;
    right: 0;
    z-index: 1;
  }
</style>

<section class="section">
  <div class="container">
    <h1 class="title is-2 has-text-centered">Join the Fun</h1>
    <div class="is-flex-tablet is-flex-wrap-wrap">
      {#each snippets as snippet, index}
        <div class="column is-one-third-widescreen is-half-tablet">
          <div
            class={'author py-2 px-4 has-text-white has-background-' + colors[r(colors.length)]}>
            {snippet.author}
          </div>
          <div bind:this={textareas[index]} />
        </div>
      {/each}
    </div>
  </div>
</section>
