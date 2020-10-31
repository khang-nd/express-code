<script>
  import modes from "../../data/modes.json";
  import { toCamelCase } from "../../utils/string";
  import { afterUpdate } from "svelte";
  import { get, set } from "local-storage";

  export let mode = get("mode") || "";
  afterUpdate(() => set("mode", mode));
</script>

<div class="field">
  <p class="control has-icons-left">
    <span class="select is-fullwidth">
      <select bind:value={mode}>
        <option disabled selected>Select Language</option>
        {#each modes as mode}
          <option value={mode}>{toCamelCase(mode)}</option>
        {/each}
      </select>
    </span>
    <span class="icon is-left">
      <i class="mdi mdi-code-braces mdi-24px" />
    </span>
  </p>
</div>
