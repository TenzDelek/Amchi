import { describe, expect, it } from "vitest";
import { parseSource } from "../src/graph/parser.js";

describe("parseSource", () => {
  it("extracts TypeScript symbols, calls and imports", async () => {
    const src = `
import { db } from "./db";
import type { User } from "../models/user.js";
export * from "./reexport";

export async function getUser(id: string): Promise<User> {
  const row = await db.query("select", [id]);
  return mapRow(row);
}

const mapRow = (row: any) => new UserModel(row);

export class UserService {
  constructor(private repo: Repo) {}
  async find(id: string) {
    return this.repo.findById(id);
  }
}
`;
    const p = (await parseSource(src, "typescript"))!;
    const names = p.symbols.map((s) => `${s.kind}:${s.name}`);
    expect(names).toEqual(
      expect.arrayContaining(["function:getUser", "function:mapRow", "class:UserService", "method:find", "method:constructor"]),
    );
    const getUser = p.symbols.find((s) => s.name === "getUser")!;
    expect(getUser.calls).toEqual(expect.arrayContaining(["query", "mapRow"]));
    expect(getUser.start).toBe(6);
    expect(p.symbols.find((s) => s.name === "mapRow")!.calls).toContain("UserModel");
    expect(p.symbols.find((s) => s.name === "find")!.parent).toBe("UserService");
    expect(p.imports).toEqual(expect.arrayContaining(["./db", "../models/user.js", "./reexport"]));
  });

  it("extracts Python symbols and relative imports", async () => {
    const src = `
import os
from .utils import helper
from . import models
from app.core.db import Session

class Repo:
    @staticmethod
    def find(id):
        return Session().get(id)

def main():
    helper(os.getcwd())
`;
    const p = (await parseSource(src, "python"))!;
    expect(p.symbols.map((s) => `${s.kind}:${s.name}`)).toEqual(
      expect.arrayContaining(["class:Repo", "method:find", "function:main"]),
    );
    expect(p.symbols.find((s) => s.name === "find")!.calls).toEqual(expect.arrayContaining(["Session", "get"]));
    expect(p.imports).toEqual(expect.arrayContaining(["os", ".utils", ".models", "app.core.db"]));
  });

  it("extracts Go functions, methods and imports", async () => {
    const src = `package svc

import (
  "fmt"
  "github.com/acme/app/internal/store"
)

type Service struct{ s *store.Store }

func (s *Service) Get(id string) error {
  v, err := s.s.Load(id)
  fmt.Println(v)
  return err
}

func New() *Service { return &Service{} }
`;
    const p = (await parseSource(src, "go"))!;
    expect(p.symbols.map((s) => `${s.kind}:${s.name}`)).toEqual(
      expect.arrayContaining(["type:Service", "method:Get", "function:New"]),
    );
    expect(p.symbols.find((s) => s.name === "Get")!.calls).toEqual(expect.arrayContaining(["Load", "Println"]));
    expect(p.imports).toEqual(expect.arrayContaining(["fmt", "github.com/acme/app/internal/store"]));
  });

  it("handles Java and Rust", async () => {
    const java = (await parseSource(
      `import com.acme.store.Store;\npublic class A { void run() { new Store().save(1); } }`,
      "java",
    ))!;
    expect(java.symbols.map((s) => s.name)).toEqual(expect.arrayContaining(["A", "run"]));
    expect(java.symbols.find((s) => s.name === "run")!.calls).toEqual(expect.arrayContaining(["Store", "save"]));
    expect(java.imports).toContain("com.acme.store.Store");

    const rust = (await parseSource(
      `use crate::store::Store;\nstruct A;\nimpl A { fn run(&self) { let s = Store::new(); s.save(); } }`,
      "rust",
    ))!;
    expect(rust.symbols.map((s) => `${s.kind}:${s.name}`)).toEqual(expect.arrayContaining(["struct:A", "impl:A", "method:run"]));
    expect(rust.symbols.find((s) => s.name === "run")!.calls).toEqual(expect.arrayContaining(["new", "save"]));
    expect(rust.imports).toContain("crate::store::Store");
  });
});

describe("qualified calls", () => {
  it("records the receiver class for this/self/static calls across languages", async () => {
    const ts = await parseSource("class Cart {\n  save() {}\n  reload() { this.save(); Store.flush(); cart.save(); new Repo().save(); }\n}\n", "typescript");
    const reload = ts!.symbols.find((s) => s.name === "reload")!;
    expect(reload.qualifiedCalls.sort()).toEqual(["Cart.save", "Store.flush"]);
    expect(reload.calls.sort()).toEqual(["Repo", "flush", "save"]);

    const py = await parseSource("class Cart:\n    def save(self):\n        pass\n    def reload(self):\n        self.save()\n        Store.flush()\n", "python");
    expect(py!.symbols.find((s) => s.name === "reload")!.qualifiedCalls.sort()).toEqual(["Cart.save", "Store.flush"]);

    const java = await parseSource("class A { void go() {} void run() { this.go(); Store.save(1); helper(); } }", "java");
    expect(java!.symbols.find((s) => s.name === "run")!.qualifiedCalls.sort()).toEqual(["A.go", "Store.save"]);

    const rust = await parseSource("struct A;\nimpl A {\n  fn go(&self) {}\n  fn run(&self) { self.go(); Store::save(); }\n}\n", "rust");
    expect(rust!.symbols.find((s) => s.name === "run")!.qualifiedCalls.sort()).toEqual(["A.go", "Store.save"]);
  });
});
