<script>
  import { onMount, afterUpdate } from "svelte";
  import dom2image from "dom-to-image";

  import SelectTheme from "./SelectTheme.svelte";
  import SelectMode from "./SelectMode.svelte";

  const content = "// edit me\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
  const commitUrl =
    "https://github.com/khang-nd/express-code/new/master/src/snippets/new";

  let theme;
  let mode;
  let textarea;
  let codeMirror;
  let isLoading;
  let isCopied;

  function copy() {
    navigator.clipboard.writeText(codeMirror.getValue()).then(() => {
      isCopied = true;
      setTimeout(() => (isCopied = false), 500);
    });
  }

  function capture(e) {
    e.preventDefault();
    const type = e.target.textContent.toLowerCase();
    let method;
    switch (type) {
      case "svg":
        method = dom2image.toSvg;
        break;
      case "jpg":
        method = dom2image.toJpeg;
        break;
      default:
        method = dom2image.toPng;
    }
    isLoading = true;
    method(textarea.parentElement).then((data) => {
      const a = document.createElement("a");
      a.href = data;
      a.download = "My snippet." + type;
      a.click();
      isLoading = false;
    });
  }

  function add() {
    const snippet = encodeURIComponent(codeMirror.getValue());
    const a = document.createElement("a");
    a.href = `${commitUrl}?filename=JohnDoe.js&value=${snippet}`;
    a.target = "_blank";
    a.click();
  }

  onMount(() => {
    codeMirror = CodeMirror.fromTextArea(textarea, { lineNumbers: true });
  });

  afterUpdate(() => {
    codeMirror.setOption("mode", mode);
    codeMirror.setOption("theme", theme);
    CodeMirror.autoLoadMode(codeMirror, mode);
  });
</script>

<section class="section">
  <div class="container">
    <h1 class="title is-2 has-text-centered">Express & Share</h1>
    <div class="columns is-variable is-1">
      <div class="column is-3 is-offset-1">
        <SelectTheme bind:theme />
      </div>
      <div class="column is-3">
        <SelectMode bind:mode />
      </div>
      <div class="column is-4 has-text-centered-mobile has-text-right">
        <button class="button is-primary is-outlined" on:click={copy}>
          <i class="mdi mdi-content-copy mdi-24px" />
          {#if isCopied}Copied{:else}Copy{/if}
        </button>
        <div class="dropdown is-right is-hoverable has-text-left">
          <div class="dropdown-trigger">
            <button
              class={'button is-primary' + (isLoading ? ' is-loading' : '')}>
              <i class="mdi mdi-camera mdi-24px" />
              Capture
            </button>
          </div>
          {#if !isLoading}
            <div class="dropdown-menu">
              <div class="dropdown-content">
                <a href class="dropdown-item" on:click={capture}>SVG</a>
                <a href class="dropdown-item" on:click={capture}>PNG</a>
                <a href class="dropdown-item" on:click={capture}>JPG</a>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
    <div class="columns is-centered">
      <div class="column is-10">
        <textarea bind:this={textarea}>{content}</textarea>
      </div>
    </div>
    <div class="columns is-centered">
      <div class="column is-5">
        <button class="button is-large is-fullwidth is-primary" on:click={add}>
          <i class="mdi mdi-chevron-double-down mdi-36px" />
          Add Below
          <i class="mdi mdi-chevron-double-down mdi-36px" />
        </button>
      </div>
    </div>
  </div>
</section>
