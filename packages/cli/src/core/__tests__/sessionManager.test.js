import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SessionManager } from "../sessionManager.js";
import { ConfigManager } from "../configManager.js";
import { Session, ProfileInfo } from "@zowe/imperative";
import keytar from "keytar";
vi.mock("@zowe/imperative");
vi.mock("keytar");
vi.mock("../configManager.js");
describe("SessionManager", () => {
    const mockConfig = {
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
    const mockCredentials = {
        user: "testuser",
        password: "testpass",
    };
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        // Mock ConfigManager
        vi.mocked(ConfigManager.getInstance).mockReturnValue({
            getConfig: () => mockConfig,
        });
        // Mock keytar
        vi.mocked(keytar.getPassword).mockImplementation((service, account) => {
            if (account.endsWith("_USER"))
                return Promise.resolve(mockCredentials.user);
            if (account.endsWith("_PWD"))
                return Promise.resolve(mockCredentials.password);
            return Promise.resolve(null);
        });
        // Mock Session
        vi.mocked(Session).mockImplementation(() => ({
        // Add mock session methods as needed
        }));
    });
    afterEach(() => {
        vi.resetModules();
    });
    describe("getInstance", () => {
        it("devrait créer une instance unique", () => {
            const instance1 = SessionManager.getInstance();
            const instance2 = SessionManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe("initialize", () => {
        it("devrait initialiser une session basic auth", async () => {
            const manager = SessionManager.getInstance();
            const session = await manager.initialize("DEV");
            expect(session).toBeDefined();
            expect(keytar.getPassword).toHaveBeenCalledTimes(2);
            expect(Session).toHaveBeenCalledWith(expect.objectContaining({
                hostname: "localhost",
                port: 443,
                user: mockCredentials.user,
                password: mockCredentials.password,
            }));
        });
        it("devrait gérer une connexion inexistante", async () => {
            const manager = SessionManager.getInstance();
            const mockConsoleError = vi
                .spyOn(console, "error")
                .mockImplementation(() => { });
            const session = await manager.initialize("INVALID");
            expect(session).toBeUndefined();
            expect(mockConsoleError).toHaveBeenCalled();
            mockConsoleError.mockRestore();
        });
        it("devrait initialiser une session Zowe", async () => {
            // Modifier la config pour tester Zowe
            const zoweConfig = {
                ...mockConfig,
                zosConnection: [
                    {
                        name: "DEV",
                        type: "zowe",
                        profile: "testprofile",
                    },
                ],
            };
            vi.mocked(ConfigManager.getInstance).mockReturnValue({
                getConfig: () => zoweConfig,
            });
            // Mock ProfileInfo
            const mockProfileInfo = {
                readProfilesFromDisk: vi.fn().mockResolvedValue(undefined),
                getAllProfiles: vi.fn().mockReturnValue([
                    {
                        profName: "testprofile",
                        profType: "zosmf",
                    },
                ]),
                mergeArgsForProfile: vi.fn().mockReturnValue({
                    knownArgs: { some: "args" },
                }),
            };
            vi.mocked(ProfileInfo).mockImplementation(() => mockProfileInfo);
            vi.mocked(ProfileInfo.createSession).mockReturnValue({});
            const manager = SessionManager.getInstance();
            const session = await manager.initialize("DEV");
            expect(session).toBeDefined();
            expect(mockProfileInfo.readProfilesFromDisk).toHaveBeenCalled();
            expect(ProfileInfo.createSession).toHaveBeenCalled();
        });
    });
    describe("getSession", () => {
        it("devrait retourner une session existante", async () => {
            const manager = SessionManager.getInstance();
            const session1 = await manager.getSession("DEV");
            const session2 = await manager.getSession("DEV");
            expect(session1).toBeDefined();
            expect(session2).toBeDefined();
            expect(session1).toBe(session2);
        });
        it("devrait créer une nouvelle session si elle n'existe pas", async () => {
            const manager = SessionManager.getInstance();
            const session = await manager.getSession("DEV");
            expect(session).toBeDefined();
            expect(keytar.getPassword).toHaveBeenCalled();
        });
        it("devrait gérer les erreurs d'initialisation", async () => {
            vi.mocked(keytar.getPassword).mockRejectedValue(new Error("Erreur keytar"));
            const manager = SessionManager.getInstance();
            const mockConsoleError = vi
                .spyOn(console, "error")
                .mockImplementation(() => { });
            const session = await manager.getSession("DEV");
            expect(session).toBeUndefined();
            expect(mockConsoleError).toHaveBeenCalled();
            mockConsoleError.mockRestore();
        });
    });
});
