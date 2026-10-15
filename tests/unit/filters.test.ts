import {describe,it,expect} from 'vitest';
function intersection<T>(all:T[],predicate:(x:T)=>boolean){return all.filter(predicate)}
describe('filter semantics',()=>{it('reduces rather than expands a set',()=>{const rows=[{branch:'a'},{branch:'b'}];expect(intersection(rows,r=>r.branch==='a')).toHaveLength(1)})});
