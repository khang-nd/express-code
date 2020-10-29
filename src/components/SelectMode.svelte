<script>
  import modes from "../data/modes.json";
  export let mode = "";
</script>

<div class="select is-fullwidth">
  <select bind:value={mode}>
    <option disabled selected>Select Language</option>
    {#each modes as mode}
      <option value={mode}>{mode}</option>
    {/each}
  </select>
</div>
