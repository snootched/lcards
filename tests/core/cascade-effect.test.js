/**
 * The cascade background's cell values come from the data grid's decorative
 * generators (src/data-grid/data-grid-model.js), one format per config, hex
 * for a format it doesn't know.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CascadeEffect } from '../../src/core/packs/backgrounds/effects/CascadeEffect.js';

const SHAPES = {
    digit: /^\d{4}$/,
    float: /^\d{1,2}\.\d{2}$/,
    alpha: /^[A-Z]{2}$/,
    hex: /^[0-9A-F]{4}$/
};

/** @param {string | undefined} format */
const cells = (format) => {
    const effect = new CascadeEffect({ format });
    return Array.from({ length: 40 }, () => effect._generateCell());
};

test('each format gives values of its shape', () => {
    for (const [format, shape] of Object.entries(SHAPES)) {
        for (const value of cells(format)) assert.match(value, shape, `${format}: ${value}`);
    }
});

test('mixed gives values of the four shapes; an unknown or missing format is hex', () => {
    for (const value of cells('mixed')) assert.ok(Object.values(SHAPES).some((s) => s.test(value)), value);
    for (const value of [...cells('bogus'), ...cells(undefined)]) assert.match(value, SHAPES.hex, value);
});
