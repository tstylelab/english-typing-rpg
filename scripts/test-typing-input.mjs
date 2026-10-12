import assert from 'node:assert/strict';
import { load } from './lib/load-typescript-data.mjs';

const { alignTypingCase } = load('src/typingInput.ts');
assert.equal(alignTypingCase('i am', 'I am here.'), 'I am');
assert.equal(alignTypingCase('THIS IS A PICTURE', 'This is a picture.'), 'This is a picture');
assert.equal(alignTypingCase('apPle', 'apple'), 'apple');
assert.equal(alignTypingCase('j am', 'I am'), 'j am');
assert.equal(alignTypingCase('I  am', 'I am'), 'I  am');
assert.equal(alignTypingCase('i am!', 'I am.'), 'I am!');
assert.equal(alignTypingCase('I am.x', 'I am.'), 'I am.x');
assert.equal(alignTypingCase('あ', 'I am'), 'あ');
assert.equal(alignTypingCase('', 'I am'), '');
console.log('PASS case alignment preserves actual spelling/spacing/punctuation mistakes');
