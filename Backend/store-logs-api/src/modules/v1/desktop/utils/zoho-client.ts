import axios from 'axios';
import FormData from 'form-data';

const DOWNLOAD_HOSTS: Record<string, string> = {
  com: 'files.zohoexternal.com/public/workdrive-external',
  in: 'files.zohopublic.in/public/workdrive-public',
  eu: 'download.zohopublic.eu/public/workdrive-public',
  'com.au': 'files.zohopublic.com.au/public/workdrive-public',
  'com.cn': 'files.zohopublic.com.cn/public/workdrive-public',
  jp: 'files.zohopublic.jp/public/workdrive-public',
  sa: 'files.zohopublic.sa/public/workdrive-public',
};

const TOKEN_TTL_MS = 55 * 60 * 1000;
const CREDS_TTL_MS = 12 * 60 * 60 * 1000;
const TEST_CREDS_TTL_MS = 2 * 60 * 1000;

const TOKEN_TTL_S = 3300;
const CREDS_TTL_S = 43200;
const TEST_CREDS_TTL_S = 120;
const CACHE_TTL_S = 43200;

const zohoApi = (domain: string) => `https://workdrive.zoho.${domain}/api/v1`;
const zohoAccounts = (domain: string) => `https://accounts.zoho.${domain}/oauth/v2/token`;

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const unwrap = (res: any) => (res && res.data && res.data.data) || undefined;

const isInvalidToken = (error: any) =>
  error &&
  error.response &&
  error.response.data &&
  Array.isArray(error.response.data.errors) &&
  error.response.data.errors[0] &&
  error.response.data.errors[0].title === 'Invalid OAuth token.';

interface Creds {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  domain: string;
}

interface CredsEntry {
  creds: Creds;
  orgId?: string;
  credsExpires: number;
  token: string;
  tokenExpires: number;
  domain: string;
}

interface AuthCtx {
  accessToken: string;
  domain: string;
}

interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<any>;
  del(key: string): Promise<any>;
}

export default class ZohoClient {
  private static _instance: ZohoClient;

  private _creds: Map<string, CredsEntry> = new Map();
  private _kv: Map<string, { value: any; expires: number }> = new Map();
  private _redis: RedisAdapter | null = null;

  public team!: {
    all: (pool: string, params: any) => Promise<any>;
    list: (pool: string) => Promise<any>;
  };
  public user!: { me: (pool: string) => Promise<any> };
  public privatespace!: { get: (pool: string, params: any) => Promise<any> };
  public ws!: {
    all: (pool: string, params: any) => Promise<any>;
    create: (pool: string, params: any) => Promise<any>;
    delete: (pool: string, params: any) => Promise<any>;
  };
  public folder!: {
    create: (pool: string, params: any) => Promise<any>;
    delete: (pool: string, params: any) => Promise<any>;
  };
  public files!: {
    list: (pool: string, params: any) => Promise<any>;
    upload: (pool: string, params: any) => Promise<any>;
    toTrash: (pool: string, params: any) => Promise<any>;
  };
  public share!: {
    list: (pool: string, params: any) => Promise<any>;
    createDownLoad: (pool: string, params: any) => Promise<any>;
  };

  constructor() {
    if (ZohoClient._instance) {
      return ZohoClient._instance;
    }

    this.team = {
      all: (pool, params) =>
        this._withToken(pool, auth => this._teamAll({ ...auth, ...params })),
      list: (pool) =>
        this._withToken(pool, auth => this._teamList(auth)),
    };
    this.user = {
      me: (pool) =>
        this._withToken(pool, auth => this._userMe(auth)),
    };
    this.privatespace = {
      get: (pool, params) =>
        this._withToken(pool, auth => this._privateSpaceGet({ ...auth, ...params })),
    };
    this.ws = {
      all: (pool, params) =>
        this._withToken(pool, auth => this._wsAll({ ...auth, ...params })),
      create: (pool, params) =>
        this._withToken(pool, auth => this._wsCreate({ ...auth, ...params })),
      delete: (pool, params) =>
        this._withToken(pool, auth => this._wsDelete({ ...auth, ...params })),
    };
    this.folder = {
      create: (pool, params) =>
        this._withToken(pool, auth => this._folderCreate({ ...auth, ...params })),
      delete: (pool, params) =>
        this._withToken(pool, auth => this._folderDelete({ ...auth, ...params })),
    };
    this.files = {
      list: (pool, params) =>
        this._withToken(pool, auth => this._filesList({ ...auth, ...params })),
      upload: (pool, params) =>
        this._withToken(pool, auth => this._filesUpload({ ...auth, ...params })),
      toTrash: (pool, params) =>
        this._withToken(pool, auth => this._filesToTrash({ ...auth, ...params })),
    };
    this.share = {
      list: (pool, params) =>
        this._withToken(pool, auth => this._shareList({ ...auth, ...params })),
      createDownLoad: (pool, params) =>
        this._withToken(pool, auth => this._shareCreateDownload({ ...auth, ...params })),
    };

    ZohoClient._instance = this;
  }

  setRedis(adapter: RedisAdapter): void {
    this._redis = adapter;
  }

  async checkCreds(pool: string, orgId?: string): Promise<boolean> {
    const local = this._creds.get(pool);
    if (local && local.credsExpires > Date.now()) return true;
    if (local) this._creds.delete(pool);

    if (this._redis && orgId) {
      const [tokenStr, credsStr] = await Promise.all([
        this._redis.get(`${orgId}_zoho_token`),
        this._redis.get(`${orgId}_zoho_creds`),
      ]);
      if (tokenStr && credsStr) {
        const tokenData = JSON.parse(tokenStr);
        const creds: Creds = JSON.parse(credsStr);
        this._creds.set(pool, {
          creds,
          orgId,
          credsExpires: Date.now() + CREDS_TTL_MS,
          token: tokenData.accessToken,
          tokenExpires: Date.now() + TOKEN_TTL_MS,
          domain: creds.domain,
        });
        return true;
      }
    }
    return false;
  }

  isTestCreds(pool: string): boolean {
    return typeof pool === 'string' && pool.charAt(0) === '$';
  }

  async addConection(pool: string, creds: Creds, orgId?: string): Promise<boolean> {
    const { accessToken } = await this._fetchAccessToken(creds);
    const isTest = this.isTestCreds(pool);
    const ttlMs = isTest ? TEST_CREDS_TTL_MS : CREDS_TTL_MS;
    const ttlS = isTest ? TEST_CREDS_TTL_S : CREDS_TTL_S;

    this._creds.set(pool, {
      creds,
      orgId,
      credsExpires: Date.now() + ttlMs,
      token: accessToken,
      tokenExpires: Date.now() + TOKEN_TTL_MS,
      domain: creds.domain,
    });

    if (this._redis && orgId) {
      await Promise.all([
        this._redis.set(
          `${orgId}_zoho_token`,
          JSON.stringify({ accessToken, domain: creds.domain }),
          TOKEN_TTL_S,
        ),
        this._redis.set(
          `${orgId}_zoho_creds`,
          JSON.stringify(creds),
          ttlS,
        ),
      ]);
    }
    return true;
  }

  getDomain(pool: string): string {
    const entry = this._creds.get(pool);
    if (!entry) {
      throw new Error('Not found creds for your pool, please make `addConection` method and try again');
    }
    return entry.domain;
  }

  async setToCashe({ pool, key, data, ttl }: { pool: string; key: string; data: any; ttl?: number }): Promise<void> {
    const ttlMs = ttl != null ? ttl * 1000 : CREDS_TTL_MS;
    this._kv.set(`${pool}::${key}`, { value: data, expires: Date.now() + ttlMs });

    if (this._redis) {
      const entry = this._creds.get(pool);
      const orgId = entry && entry.orgId;
      if (orgId) {
        await this._redis.set(`${orgId}_zoho_cache_${key}`, JSON.stringify(data), ttl || CACHE_TTL_S);
      }
    }
  }

  async getFromCashe({ pool, key }: { pool: string; key: string }): Promise<any> {
    const localEntry = this._kv.get(`${pool}::${key}`);
    if (localEntry && localEntry.expires > Date.now()) return localEntry.value;
    if (localEntry) this._kv.delete(`${pool}::${key}`);

    if (this._redis) {
      const entry = this._creds.get(pool);
      const orgId = entry && entry.orgId;
      if (orgId) {
        const val = await this._redis.get(`${orgId}_zoho_cache_${key}`);
        if (val) {
          const parsed = JSON.parse(val);
          this._kv.set(`${pool}::${key}`, { value: parsed, expires: Date.now() + CREDS_TTL_MS });
          return parsed;
        }
      }
    }
    return undefined;
  }

  parseDownloadUrlById(fileId: string, downLinkId: string, domain: string): string {
    const host = DOWNLOAD_HOSTS[domain];
    if (!host) throw new Error(`Unsupported Zoho domain: ${domain}`);
    const xCliMsg = encodeURIComponent(JSON.stringify({ linkId: downLinkId }));
    return `https://${host}/download/${fileId}?x-cli-msg=${xCliMsg}`;
  }

  getPrivateSpaceId(pool: string): string | undefined {
    const entry = this._creds.get(pool);
    return entry && entry.creds ? (entry.creds as any).privateSpaceId : undefined;
  }

  // ── internal ────────────────────────────────────────────────────────

  private async _fetchAccessToken(creds: Creds): Promise<AuthCtx> {
    const { clientId, clientSecret, refreshToken, domain } = creds;
    try {
      const res = await axios.post(zohoAccounts(domain), null, {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        },
      });
      if (res.data && res.data.error) throw new Error(res.data.error);
      return { accessToken: res.data.access_token, domain };
    } catch (error) {
      const err: any = error;
      if (err && err.message === `getaddrinfo ENOTFOUND accounts.zoho.${domain}`) {
        throw new Error(`Invalid domain - ${domain}`);
      }
      throw err;
    }
  }

  private async _ensureToken(pool: string): Promise<AuthCtx> {
    const entry = this._creds.get(pool);
    if (!entry) throw new Error('Not found creds for your pool, please make `addConection` method and try again');

    if (entry.tokenExpires > Date.now()) {
      return { accessToken: entry.token, domain: entry.domain };
    }

    if (this._redis && entry.orgId) {
      const tokenStr = await this._redis.get(`${entry.orgId}_zoho_token`);
      if (tokenStr) {
        const tokenData = JSON.parse(tokenStr);
        entry.token = tokenData.accessToken;
        entry.tokenExpires = Date.now() + TOKEN_TTL_MS;
        return { accessToken: tokenData.accessToken, domain: entry.domain };
      }
    }

    return this._refreshToken(pool);
  }

  private async _refreshToken(pool: string): Promise<AuthCtx> {
    const entry = this._creds.get(pool);
    if (!entry) throw new Error('Not found creds for your pool, please make `addConection` method and try again');
    const fresh = await this._fetchAccessToken(entry.creds);
    entry.token = fresh.accessToken;
    entry.tokenExpires = Date.now() + TOKEN_TTL_MS;

    if (this._redis && entry.orgId) {
      await this._redis.set(
        `${entry.orgId}_zoho_token`,
        JSON.stringify({ accessToken: fresh.accessToken, domain: entry.domain }),
        TOKEN_TTL_S,
      );
    }
    return { accessToken: fresh.accessToken, domain: entry.domain };
  }

  private async _withToken<T>(pool: string, cb: (auth: AuthCtx) => Promise<T>): Promise<T> {
    try {
      const auth = await this._ensureToken(pool);
      return await cb(auth);
    } catch (error) {
      if (!isInvalidToken(error)) throw error;
      const auth = await this._refreshToken(pool);
      return cb(auth);
    }
  }

  // ── Zoho WorkDrive REST endpoints ───────────────────────────────────

  private async _teamAll({ accessToken, domain, zuid }: any) {
    const res = await axios.get(`${zohoApi(domain)}/users/${zuid}/teams`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _teamList({ accessToken, domain }: any) {
    const res = await axios.get(`${zohoApi(domain)}/teams`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _userMe({ accessToken, domain }: any) {
    const res = await axios.get(`${zohoApi(domain)}/users/me`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _privateSpaceGet({ accessToken, domain, zuid }: any) {
    const res = await axios.get(`${zohoApi(domain)}/users/${zuid}/privatespace`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _wsAll({ accessToken, domain, teamId }: any) {
    const res = await axios.get(`${zohoApi(domain)}/teams/${teamId}/workspaces`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _wsCreate({ accessToken, domain, teamId, name, isPublicTeam, description }: any) {
    const body = { data: { attributes: { name, parent_id: teamId, is_public_within_team: isPublicTeam, description }, type: 'workspaces' } };
    const res = await axios.post(`${zohoApi(domain)}/workspaces`, body, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _wsDelete({ accessToken, domain, wsId }: any) {
    const res = await axios.delete(`${zohoApi(domain)}/workspaces/${wsId}`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _folderCreate({ accessToken, domain, parentId, name }: any) {
    const body = { data: { attributes: { name, parent_id: parentId }, type: 'files' } };
    const res = await axios.post(`${zohoApi(domain)}/files`, body, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _folderDelete({ accessToken, domain, folderId }: any) {
    const res = await axios.delete(`${zohoApi(domain)}/files/${folderId}`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _filesList({ accessToken, domain, folderId, offset, limit }: any) {
    const qs: string[] = [];
    if (offset) qs.push(`page%5Boffset%5D=${offset}`);
    if (limit) qs.push(`page%5Blimit%5D=${limit}`);
    else if (offset) qs.push('page%5Blimit%5D=50');
    const query = qs.length ? `?${qs.join('&')}` : '';
    const res = await axios.get(`${zohoApi(domain)}/files/${folderId}/files${query}`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _filesUpload({ accessToken, domain, parentId, name, overrideNameExist, readableStream, contentType }: any) {
    const fd = new FormData();
    const fileOpt: any = contentType ? { filename: name, contentType } : { filename: name };
    fd.append('content', readableStream, fileOpt);
    const url = `${zohoApi(domain)}/upload?filename=${encodeURIComponent(name)}&parent_id=${parentId}&override-name-exist=${overrideNameExist ? 'true' : 'false'}`;
    const res = await axios.post(url, fd, {
      headers: { ...authHeaders(accessToken), ...fd.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return unwrap(res);
  }
  private async _filesToTrash({ accessToken, domain, fileId }: any) {
    const body = { data: { attributes: { status: '51' }, id: fileId, type: 'files' } };
    const res = await axios.patch(`${zohoApi(domain)}/files/${fileId}`, body, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _shareList({ accessToken, domain, fileId }: any) {
    const res = await axios.get(`${zohoApi(domain)}/files/${fileId}/links`, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
  private async _shareCreateDownload({ accessToken, domain, resourceId, name, requestUserData, expiredDate, downloadLimit }: any) {
    const body = {
      data: {
        attributes: {
          resource_id: resourceId, link_name: name, request_user_data: requestUserData,
          expiration_date: expiredDate, download_link: { download_limit: downloadLimit },
          link_type: 'download', allow_download: true,
        },
        type: 'links',
      },
    };
    const res = await axios.post(`${zohoApi(domain)}/links`, body, { headers: authHeaders(accessToken) });
    return unwrap(res);
  }
}
