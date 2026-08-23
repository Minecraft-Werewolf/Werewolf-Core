import type { SemVer } from "@kairo-js/properties";
import { SemVerUtils } from "../../utils/semver";

export function satisfiesVersionRange(
    version: SemVer,
    range: string,
    options?: { readonly includePrerelease?: boolean },
): boolean {
    return SemVerUtils.satisfies(version, range, options);
}
