"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1771760838495 = void 0;
var InitialSchema1771760838495 = /** @class */ (function () {
    function InitialSchema1771760838495() {
        this.name = 'InitialSchema1771760838495';
    }
    InitialSchema1771760838495.prototype.up = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("CREATE TABLE \"accounts\" (\"id\" character varying(255) NOT NULL, \"username\" character varying(255), \"full_name\" character varying(500), \"description\" text, \"is_verified\" boolean NOT NULL DEFAULT false, \"restricted\" character varying(100), \"internal_id\" integer, \"status\" character varying(100), \"id_alt\" character varying(255), \"type\" character varying(50) NOT NULL DEFAULT 'Facebook', CONSTRAINT \"PK_5a7a02c20412299d198e097a8fe\" PRIMARY KEY (\"id\"))")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"idx_account_internal_id\" ON \"accounts\" (\"internal_id\") ")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"posts\" (\"id\" character varying(255) NOT NULL, \"profile_id\" character varying(255) NOT NULL, \"created_time\" TIMESTAMP WITH TIME ZONE NOT NULL, \"text_original\" text, \"comments_count\" integer NOT NULL DEFAULT '0', CONSTRAINT \"PK_2829ac61eff60fcec60d7274b9e\" PRIMARY KEY (\"id\"))")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"idx_post_profile_id\" ON \"posts\" (\"profile_id\") ")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"idx_post_created_time\" ON \"posts\" (\"created_time\") ")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"follower_sources\" (\"id\" SERIAL NOT NULL, \"account_internal_id\" integer NOT NULL, \"followers_count\" integer NOT NULL, CONSTRAINT \"PK_55ec8c924484165f0d9d922c91e\" PRIMARY KEY (\"id\"))")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"idx_follower_account_internal_id\" ON \"follower_sources\" (\"account_internal_id\") ")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"posts\" ADD CONSTRAINT \"FK_9dbc2524c6f46641f5e7d107da1\" FOREIGN KEY (\"profile_id\") REFERENCES \"accounts\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 8:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InitialSchema1771760838495.prototype.down = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE \"posts\" DROP CONSTRAINT \"FK_9dbc2524c6f46641f5e7d107da1\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"public\".\"idx_follower_account_internal_id\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"follower_sources\"")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"public\".\"idx_post_created_time\"")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"public\".\"idx_post_profile_id\"")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"posts\"")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"public\".\"idx_account_internal_id\"")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"accounts\"")];
                    case 8:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return InitialSchema1771760838495;
}());
exports.InitialSchema1771760838495 = InitialSchema1771760838495;
