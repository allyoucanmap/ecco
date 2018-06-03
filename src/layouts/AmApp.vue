/* copyright 2018, stefano bovio @allyoucanmap. */

<style>
    * {
        box-sizing: border-box;
        color: #444444;
        outline-color: #91f3f7;
        font-family: OpenSans-Light;
    }
    button {
        height: 21px;
        min-width: 21px;
        font-size: 12px;
        justify-content: center;
        background-color: transparent;
        border: 1px solid rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
    }
    button.am-icon {
        font-family: icone;
        height: 21px;
        width: 21px;
        padding: 0;
    }
    button.am-icon span {
        font-family: icone;
    }
    button.inverse {
        background-color: #333333;
        color: #aaaaaa;
        border-color: #aaaaaa;
    }
    button.am-selected {
        background-color: #91f3f7;
    }
    button.inverse:active {
        background-color: #000000;
    }
    button.inverse:hover {
        background-color: #000000;
    }
    button.am-active {
        background-color: #91f3f7;
        box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.06), inset 0 4px 8px rgba(0, 0, 0, 0.12);
    }
    input {
        border: 1px solid rgba(0, 0, 0, 0.12);
        background-color: #f6f6f6;
        width: 100%;
        padding: 4px;
        font-family: Inconsolata;
    }
    button:hover {
        background-color: #aaeeee;
    }
    button:active {
        background-color: #55eeee;
    }
    body {
        margin: 0;
        font-family: Georgia, "Times New Roman", Times, serif;
        background-color: #fafafa;
    }
    .am-container {
        position: absolute;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 200px 400px repeat(7, 1fr) 32px;
        grid-template-rows: 32px repeat(5, 1fr) 32px;
    }
    .am-header {
        grid-column: 1 / 11;
        grid-row: 1 / 2;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.12);
        z-index: 30;
        background-color: #f6f6f6;
    }
    .am-list {
        grid-column: 1 / 2;
        grid-row: 2 / 8;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.09), 0 4px 8px rgba(0, 0, 0, 0.18);
        z-index: 20;
        background-color: #f4f4f4;
    }
    .am-editor {
        grid-column: 2 / 3;
        grid-row: 2 / 8;
        box-shadow: 3px 0 6px rgba(0, 0, 0, 0.06), 4px 0 8px rgba(0, 0, 0, 0.12);
        background-color: #f2f2f2;
        z-index: 10;
        position: relative;
        overflow-y: auto;
    }
    .am-gl {
        grid-column: 3 / 10;
        grid-row: 2 / 7;
        font-size: 0;
    }
    .am-disabled {
        opacity: 0.4;
    }
    .am-zoom-slider {
        grid-column: 10 / 11;
        grid-row: 2 / 8;
        z-index: 10;
        background-color: #f2f2f2;
        box-shadow: -3px 0 6px rgba(0, 0, 0, 0.06), -4px 0 8px rgba(0, 0, 0, 0.12);
    }

    .am-tools {
        grid-column: 3 / 10;
        grid-row: 7 / 8;
        z-index: 5;
        background-color: #f2f2f2;
        box-shadow: -3px 0 6px rgba(0, 0, 0, 0.06), -4px 0 8px rgba(0, 0, 0, 0.12);
    }

    /*! nouislider - 10.1.0 - 2017-07-28 17:11:18 */
    /* Functional styling;
    * These styles are required for noUiSlider to function.
    * You don't need to change these rules to apply your design.
    */
    .noUi-target,
    .noUi-target * {
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        -webkit-user-select: none;
        -ms-touch-action: none;
        touch-action: none;
        -ms-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }
    .noUi-target {
        position: relative;
        direction: ltr;
    }
    .noUi-base {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        /* Fix 401 */
    }
    .noUi-connect {
        position: absolute;
        right: 0;
        top: 0;
        left: 0;
        bottom: 0;
    }
    .noUi-origin {
        position: absolute;
        height: 0;
        width: 0;
    }
    .noUi-handle {
        position: relative;
        z-index: 1;
    }
    .noUi-state-tap .noUi-connect,
    .noUi-state-tap .noUi-origin {
        -webkit-transition: top 0.3s, right 0.3s, bottom 0.3s, left 0.3s;
        transition: top 0.3s, right 0.3s, bottom 0.3s, left 0.3s;
    }
    .noUi-state-drag * {
        cursor: inherit !important;
    }
    /* Painting and performance;
    * Browsers can paint handles in their own layer.
    */
    .noUi-base,
    .noUi-handle {
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
    }
    /* Slider size and handle placement;
    */
    .noUi-horizontal {
        height: 4px;
    }
    .noUi-horizontal .noUi-handle {
        width: 10px;
        height: 12px;
        left: -5px;
        top: -5px;
    }
    .noUi-vertical {
        width: 18px;
    }
    .noUi-vertical .noUi-handle {
        width: 28px;
        height: 34px;
        left: -6px;
        top: -17px;
    }
    /* Styling;
    */
    .noUi-target {
        background: #fafafa;
        border-radius: 0;
        border: 1px solid #d3d3d3;
        box-shadow: inset 0 1px 1px #f0f0f0, 0 3px 6px -5px #bbb;
    }
    .noUi-connect {
        background: #3fb8af;
        border-radius: 0;
        box-shadow: inset 0 0 3px rgba(51, 51, 51, 0.45);
        -webkit-transition: background 450ms;
        transition: background 450ms;
    }
    /* Handles and cursors;
    */
    .noUi-draggable {
        cursor: ew-resize;
    }
    .noUi-vertical .noUi-draggable {
        cursor: ns-resize;
    }
    .noUi-handle {
        border: 1px solid #d9d9d9;
        border-radius: 0;
        background: #fff;
        cursor: default;
        box-shadow: inset 0 0 1px #fff, inset 0 1px 7px #ebebeb, 0 3px 6px -3px #bbb;
    }
    .noUi-active {
        box-shadow: inset 0 0 1px #fff, inset 0 1px 7px #ddd, 0 3px 6px -3px #bbb;
    }
    /* Handle stripes;
    */
    .noUi-handle:before,
    .noUi-handle:after {
        content: "";
        display: none;
        position: absolute;
        height: 14px;
        width: 1px;
        background: #e8e7e6;
        left: 14px;
        top: 6px;
    }
    .noUi-handle:after {
        left: 17px;
    }
    .noUi-vertical .noUi-handle:before,
    .noUi-vertical .noUi-handle:after {
        width: 14px;
        height: 1px;
        left: 6px;
        top: 14px;
    }
    .noUi-vertical .noUi-handle:after {
        top: 17px;
    }
    /* Disabled state;
    */
    [disabled] .noUi-connect {
        background: #b8b8b8;
    }
    [disabled].noUi-target,
    [disabled].noUi-handle,
    [disabled] .noUi-handle {
        cursor: not-allowed;
    }
    /* Base;
    *
    */
    .noUi-pips,
    .noUi-pips * {
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }
    .noUi-pips {
        position: absolute;
        color: #999;
    }
    /* Values;
    *
    */
    .noUi-value {
        position: absolute;
        white-space: nowrap;
        text-align: center;
    }
    .noUi-value-sub {
        color: #ccc;
        font-size: 10px;
    }
    /* Markings;
    *
    */
    .noUi-marker {
        position: absolute;
        background: #ccc;
    }
    .noUi-marker-sub {
        background: #aaa;
    }
    .noUi-marker-large {
        background: #aaa;
    }
    /* Horizontal layout;
    *
    */
    .noUi-pips-horizontal {
        padding: 10px 0;
        height: 80px;
        top: 100%;
        left: 0;
        width: 100%;
    }
    .noUi-value-horizontal {
        -webkit-transform: translate3d(-50%, 50%, 0);
        transform: translate3d(-50%, 50%, 0);
    }
    .noUi-marker-horizontal.noUi-marker {
        margin-left: -1px;
        width: 2px;
        height: 5px;
    }
    .noUi-marker-horizontal.noUi-marker-sub {
        height: 10px;
    }
    .noUi-marker-horizontal.noUi-marker-large {
        height: 15px;
    }
    /* Vertical layout;
    *
    */
    .noUi-pips-vertical {
        padding: 0 10px;
        height: 100%;
        top: 0;
        left: 100%;
    }
    .noUi-value-vertical {
        -webkit-transform: translate3d(0, 50%, 0);
        transform: translate3d(0, 50%, 0);
        padding-left: 25px;
    }
    .noUi-marker-vertical.noUi-marker {
        width: 5px;
        height: 2px;
        margin-top: -1px;
    }
    .noUi-marker-vertical.noUi-marker-sub {
        width: 10px;
    }
    .noUi-marker-vertical.noUi-marker-large {
        width: 15px;
    }
    .noUi-tooltip {
        display: block;
        position: absolute;
        border: none;
        border-radius: 0;
        background: #fff;
        color: #000;
        padding: 5px;
        text-align: center;
        white-space: nowrap;
        font-family: Inconsolata;
        font-size: 10px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.12);
    }
    .noUi-horizontal .noUi-tooltip {
        -webkit-transform: translate(-50%, 0);
        transform: translate(-50%, 0);
        left: 50%;
        bottom: 120%;
    }
    .noUi-vertical .noUi-tooltip {
        -webkit-transform: translate(0, -50%);
        transform: translate(0, -50%);
        top: 50%;
        right: 150%;
    }
    .noUi-connect {
        background: #91f3f7;
        box-shadow: none;
    }
    .noUi-vertical .noUi-handle {
        width: 26px;
        height: 12px;
        left: -6px;
        top: -6px;
    }
</style>

<template lang="html">
    <div
        id="app"
        class="am-container"
        oncontextmenu="return false;">
        <am-header/>
        <am-list/>
        <am-editor/>
        <am-gl/>
        <am-zoom-slider/>
        <am-tools />
    </div>
</template>

<script>
import components from "../utils/requires/getComponents.js";

export default {
  components
};
</script>