import type { SemVer } from "@kairo-js/properties";
import semver from "semver";

export class SemVerUtils {
    static format(version: SemVer): string {
        let result = `${version.major}.${version.minor}.${version.patch}`;

        if (version.prerelease) {
            result += `-${version.prerelease}`;
        }

        if (version.build) {
            result += `+${version.build}`;
        }

        return result;
    }

    static compare(a: SemVer, b: SemVer): number {
        return semver.compare(this.format(a), this.format(b));
    }

    static rcompare(a: SemVer, b: SemVer): number {
        return semver.rcompare(this.format(a), this.format(b));
    }

    static satisfies(version: SemVer, range: string): boolean {
        return semver.satisfies(this.format(version), range);
    }

    static equals(a: SemVer, b: SemVer): boolean {
        return this.compare(a, b) === 0;
    }

    static isPrerelease(version: SemVer): boolean {
        return version.prerelease !== undefined;
    }
}
