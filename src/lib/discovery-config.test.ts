import test from "node:test";
import assert from "node:assert/strict";
import { discoverySettingsStorageKeyForUser } from "./discovery-config";

test("discoverySettingsStorageKeyForUser scopes keys by fid", () => {
  assert.equal(discoverySettingsStorageKeyForUser(123), "stmbl.discovery.settings.v1.123");
  assert.equal(discoverySettingsStorageKeyForUser(), "stmbl.discovery.settings.v1.anon");
});
