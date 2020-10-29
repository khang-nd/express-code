<script>
  import { onMount, afterUpdate } from "svelte";
  import html2canvas from "html2canvas";
  import snippets from "./data/snippets.json";
  import SelectTheme from "./components/SelectTheme.svelte";
  import SelectMode from "./components/SelectMode.svelte";

  const [_] = snippets;
  let content = "// edit me";
  let theme;
  let mode;
  let editor;

  function capture() {
    // const elem = document.querySelector("#editor").parentElement;
    // html2canvas(elem).then((canvas) => {
    //   const a = document.createElement("a");
    //   a.href = canvas.toDataURL();
    //   a.download = "My snippet.png";
    //   a.click();
    // });
  }

  onMount(() => {
    document.querySelectorAll("textarea").forEach((elem) => {
      const { id, readOnly } = elem;
      const cm = CodeMirror.fromTextArea(elem, {
        lineNumbers: true,
        theme: "base16-dark",
        mode: "javascript",
        readOnly,
      });
      if (id === "editor") editor = cm;
    });

    editor.on("change", () => (content = editor.getValue()));
  });

  afterUpdate(() => {
    editor.setOption("mode", mode);
    editor.setOption("theme", theme);
    CodeMirror.autoLoadMode(editor, mode);

    const lineCount = editor.lineCount();
    let { line } = editor.getCursor();
    for (let i = 0; i < 15 - lineCount; i++) {
      editor.replaceRange("\n", { line });
      line++;
    }
  });
</script>

<style>
  @media screen and (min-width: 769px) {
    .hero-snippet {
      margin-top: -10rem;
    }
    .hero-body > .container {
      padding: 3rem;
    }
  }
</style>

<main>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="container columns">
        <figure class="image p-2 is-128x128 is-hidden-touch">
          <img src="/favicon.svg" alt="Logo" />
        </figure>
        <div class="column is-5 pt-0">
          <h1 class="title is-1">Express Code</h1>
          <p class="subtitle">
            As developers, what cooler way to
            <u>express</u>
            ourselves other than with
            <u>code</u>?
          </p>
        </div>
      </div>
    </div>
  </section>
  <div class="columns is-gapless hero-snippet">
    <div class="column is-6" />
    <div class="column is-5"><textarea readonly>{_.content}</textarea></div>
  </div>
  <section class="section">
    <div class="container">
      <h1 class="title is-2 has-text-centered">Express & Share</h1>
      <div class="columns is-variable is-1">
        <div class="column is-4 is-offset-1">
          <SelectTheme bind:theme />
        </div>
        <div class="column is-4">
          <SelectMode bind:mode />
        </div>
        <div class="column is-1">
          <div on:click>Copy</div>
        </div>
        <div class="column is-1">
          <div on:click={capture}>Capture</div>
        </div>
      </div>

      <div class="columns is-centered">
        <div class="column is-10">
          <textarea id="editor">{content}</textarea>
        </div>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <h1 class="title is-2 has-text-centered">The Awesomeness</h1>
    </div>
  </section>
</main>
