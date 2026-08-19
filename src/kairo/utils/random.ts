export interface Random {
    next(): number;
}

export class MathRandom implements Random {
    next(): number {
        return Math.random();
    }
}
