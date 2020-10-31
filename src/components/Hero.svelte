<script>
  import snippets from "../data/snippets.json";
  import { onMount } from "svelte";

  const _ = snippets.find((snippet) => /JohnDoe/.test(snippet.author));
  let sample;

  onMount(() => {
    const { mode } = CodeMirror.findModeByExtension(_.extension);
    const cm = new CodeMirror(sample, {
      lineNumbers: true,
      theme: "base16-dark",
      readOnly: true,
      value: _.content,
      mode,
    });
    CodeMirror.autoLoadMode(cm, mode);
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

<section class="hero is-primary">
  <div class="hero-body">
    <div class="container columns">
      <figure class="image p-2 is-128x128 is-hidden-touch">
        <img src="favicon.svg" alt="Logo" />
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
  <div class="column is-5">
    <div class="sample" bind:this={sample} />
  </div>
</div>
