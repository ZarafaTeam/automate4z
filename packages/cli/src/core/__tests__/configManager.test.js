import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ConfigManager } from "../configManager.js";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
vi.mock("fs");
vi.mock("path");
vi.mock("js-yaml");
describe("ConfigManager", () => {
    const mockConfig = {
        appName: "automate4z",
        version: "1.0.0",
        defaultZosConnection: "DEV",
        zosConnection: [
            {
                name: "DEV",
                type: "basic",
                hostname: "localhost",
                port: 443,
            },
        ],
    };
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        // Mock path.resolve
        vi.mocked(path.resolve).mockReturnValue("/mock/path/config.yaml");
        // Mock fs.readFileSync
        vi.mocked(fs.readFileSync).mockReturnValue("mock file content");
        // Mock yaml.load
        vi.mocked(yaml.load).mockReturnValue(mockConfig);
    });
    afterEach(() => {
        vi.resetModules();
    });
    describe("getInstance", () => {
        it("devrait créer une instance unique", () => {
            const instance1 = ConfigManager.getInstance();
            const instance2 = ConfigManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe("getConfig", () => {
        it("devrait retourner la configuration chargée", () => {
            const config = ConfigManager.getInstance().getConfig();
            expect(config).toEqual(mockConfig);
        });
        it("devrait charger la configuration depuis le fichier", () => {
            ConfigManager.getInstance();
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(yaml.load).toHaveBeenCalled();
        });
    });
    describe("Gestion des erreurs", () => {
        it("devrait gérer une erreur de lecture de fichier", () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error("Erreur de lecture");
            });
            const mockExit = vi
                .spyOn(process, "exit")
                .mockImplementation(() => undefined);
            const mockConsoleError = vi
                .spyOn(console, "error")
                .mockImplementation(() => { });
            expect(() => ConfigManager.getInstance()).not.toThrow();
            expect(mockConsoleError).toHaveBeenCalled();
            expect(mockExit).toHaveBeenCalledWith(1);
            mockExit.mockRestore();
            mockConsoleError.mockRestore();
        });
        it("devrait gérer une erreur de parsing YAML", () => {
            vi.mocked(yaml.load).mockImplementation(() => {
                throw new Error("Erreur YAML");
            });
            const mockExit = vi
                .spyOn(process, "exit")
                .mockImplementation(() => undefined);
            const mockConsoleError = vi
                .spyOn(console, "error")
                .mockImplementation(() => { });
            expect(() => ConfigManager.getInstance()).not.toThrow();
            expect(mockConsoleError).toHaveBeenCalled();
            expect(mockExit).toHaveBeenCalledWith(1);
            mockExit.mockRestore();
            mockConsoleError.mockRestore();
        });
    });
});
