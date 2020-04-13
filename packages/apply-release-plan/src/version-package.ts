import { ComprehensiveRelease, PackageJSON } from "@changesets/types";
import getVersionRangeType from "@changesets/get-version-range-type";
import { Range } from "semver";

const DEPENDENCY_TYPES = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies"
] as const;

export default function versionPackage(
  release: ComprehensiveRelease & {
    changelog: string | null;
    packageJson: PackageJSON;
    dir: string;
  },
  versionsToUpdate: Array<{ name: string; version: string }>
) {
  let { newVersion, packageJson } = release;

  packageJson.version = newVersion;

  for (let type of DEPENDENCY_TYPES) {
    let deps = packageJson[type];
    if (deps) {
      for (let { name, version } of versionsToUpdate) {
        let depCurrentVersion = deps[name];
        if (!depCurrentVersion || ['link:', 'link:.', 'file:', 'file:.'].includes(depCurrentVersion)) continue;
        const usesWorkspaceRange = depCurrentVersion.startsWith("workspace:");
        if (usesWorkspaceRange) {
          depCurrentVersion = depCurrentVersion.substr(10);
        }
        if (
          // an empty string is the normalised version of x/X/*
          // we don't want to change these versions because they will match
          // any version and if someone makes the range that
          // they probably want it to stay like that
          new Range(depCurrentVersion).range !== ""
        ) {
          let rangeType = getVersionRangeType(depCurrentVersion);
          let newNewRange = `${rangeType}${version}`;
          if (usesWorkspaceRange) newNewRange = `workspace:${newNewRange}`;
          deps[name] = newNewRange;
        }
      }
    }
  }

  return { ...release, packageJson };
}
