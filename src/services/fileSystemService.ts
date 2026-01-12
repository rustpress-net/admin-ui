/**
 * File System Service
 * Provides file browsing and editing capabilities for the RustPress project
 */

const API_BASE = '/api/v1';

// ============================================
// TYPES
// ============================================

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  modified?: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
  language: string;
  size: number;
  modified: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * List files and directories in a path
 */
export async function listDirectory(path: string = ''): Promise<FileNode[]> {
  try {
    const response = await fetch(`${API_BASE}/files/list?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error('Failed to list directory');
    return await response.json();
  } catch (error) {
    console.error('Error listing directory:', error);
    // Return mock data for development based on path
    return getMockFileTree(path);
  }
}

/**
 * Read file content
 */
export async function readFile(path: string): Promise<FileContent> {
  try {
    const response = await fetch(`${API_BASE}/files/read?path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error('Failed to read file');
    return await response.json();
  } catch (error) {
    console.error('Error reading file:', error);
    return getMockFileContent(path);
  }
}

/**
 * Write file content
 */
export async function writeFile(path: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/write`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
    if (!response.ok) throw new Error('Failed to write file');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    // Store in localStorage as fallback
    localStorage.setItem(`rustpress_file_${path}`, content);
    return true;
  }
}

/**
 * Create a new file or directory
 */
export async function createFile(path: string, type: 'file' | 'folder'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, type }),
    });
    if (!response.ok) throw new Error('Failed to create file');
    return true;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
}

/**
 * Delete a file or directory
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!response.ok) throw new Error('Failed to delete file');
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Rename a file or directory
 */
export async function renameFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    });
    if (!response.ok) throw new Error('Failed to rename file');
    return true;
  } catch (error) {
    console.error('Error renaming file:', error);
    return false;
  }
}

// ============================================
// HELPERS
// ============================================

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'md': 'markdown',
    'mdx': 'markdown',
    'svg': 'xml',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',

    // Rust
    'rs': 'rust',
    'toml': 'toml',

    // Config
    'env': 'plaintext',
    'gitignore': 'plaintext',
    'dockerignore': 'plaintext',
    'editorconfig': 'ini',

    // SQL
    'sql': 'sql',

    // Shell
    'sh': 'shell',
    'bash': 'shell',
    'ps1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',
  };
  return languageMap[ext || ''] || 'plaintext';
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

function getMockFileTree(rootPath: string = ''): FileNode[] {
  // Return specific mock data based on the root path
  switch (rootPath) {
    case 'themes':
      return getMockThemesTree();
    case 'functions':
      return getMockFunctionsTree();
    case 'plugins':
      return getMockPluginsTree();
    case 'assets':
      return getMockAssetsTree();
    case 'crates':
      return getMockCratesTree();
    default:
      return getMockRootTree();
  }
}

function getMockThemesTree(): FileNode[] {
  return [
    {
      id: 'themes/rustpress-developer',
      name: 'rustpress-developer',
      path: 'themes/rustpress-developer',
      type: 'folder',
      children: [
        {
          id: 'themes/rustpress-developer/theme.json',
          name: 'theme.json',
          path: 'themes/rustpress-developer/theme.json',
          type: 'file',
        },
        {
          id: 'themes/rustpress-developer/templates',
          name: 'templates',
          path: 'themes/rustpress-developer/templates',
          type: 'folder',
          children: [
            {
              id: 'themes/rustpress-developer/templates/base.html',
              name: 'base.html',
              path: 'themes/rustpress-developer/templates/base.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/templates/home.html',
              name: 'home.html',
              path: 'themes/rustpress-developer/templates/home.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/templates/post.html',
              name: 'post.html',
              path: 'themes/rustpress-developer/templates/post.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/templates/page.html',
              name: 'page.html',
              path: 'themes/rustpress-developer/templates/page.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/templates/archive.html',
              name: 'archive.html',
              path: 'themes/rustpress-developer/templates/archive.html',
              type: 'file',
            },
          ],
        },
        {
          id: 'themes/rustpress-developer/partials',
          name: 'partials',
          path: 'themes/rustpress-developer/partials',
          type: 'folder',
          children: [
            {
              id: 'themes/rustpress-developer/partials/header.html',
              name: 'header.html',
              path: 'themes/rustpress-developer/partials/header.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/partials/footer.html',
              name: 'footer.html',
              path: 'themes/rustpress-developer/partials/footer.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/partials/sidebar.html',
              name: 'sidebar.html',
              path: 'themes/rustpress-developer/partials/sidebar.html',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/partials/nav.html',
              name: 'nav.html',
              path: 'themes/rustpress-developer/partials/nav.html',
              type: 'file',
            },
          ],
        },
        {
          id: 'themes/rustpress-developer/assets',
          name: 'assets',
          path: 'themes/rustpress-developer/assets',
          type: 'folder',
          children: [
            {
              id: 'themes/rustpress-developer/assets/css',
              name: 'css',
              path: 'themes/rustpress-developer/assets/css',
              type: 'folder',
              children: [
                {
                  id: 'themes/rustpress-developer/assets/css/style.css',
                  name: 'style.css',
                  path: 'themes/rustpress-developer/assets/css/style.css',
                  type: 'file',
                },
                {
                  id: 'themes/rustpress-developer/assets/css/variables.css',
                  name: 'variables.css',
                  path: 'themes/rustpress-developer/assets/css/variables.css',
                  type: 'file',
                },
              ],
            },
            {
              id: 'themes/rustpress-developer/assets/js',
              name: 'js',
              path: 'themes/rustpress-developer/assets/js',
              type: 'folder',
              children: [
                {
                  id: 'themes/rustpress-developer/assets/js/main.js',
                  name: 'main.js',
                  path: 'themes/rustpress-developer/assets/js/main.js',
                  type: 'file',
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function getMockFunctionsTree(): FileNode[] {
  return [
    {
      id: 'functions/hello-world.js',
      name: 'hello-world.js',
      path: 'functions/hello-world.js',
      type: 'file',
    },
    {
      id: 'functions/contact-form.js',
      name: 'contact-form.js',
      path: 'functions/contact-form.js',
      type: 'file',
    },
    {
      id: 'functions/newsletter-signup.js',
      name: 'newsletter-signup.js',
      path: 'functions/newsletter-signup.js',
      type: 'file',
    },
    {
      id: 'functions/analytics-tracker.js',
      name: 'analytics-tracker.js',
      path: 'functions/analytics-tracker.js',
      type: 'file',
    },
    {
      id: 'functions/api',
      name: 'api',
      path: 'functions/api',
      type: 'folder',
      children: [
        {
          id: 'functions/api/posts.js',
          name: 'posts.js',
          path: 'functions/api/posts.js',
          type: 'file',
        },
        {
          id: 'functions/api/users.js',
          name: 'users.js',
          path: 'functions/api/users.js',
          type: 'file',
        },
        {
          id: 'functions/api/comments.js',
          name: 'comments.js',
          path: 'functions/api/comments.js',
          type: 'file',
        },
      ],
    },
    {
      id: 'functions/scheduled',
      name: 'scheduled',
      path: 'functions/scheduled',
      type: 'folder',
      children: [
        {
          id: 'functions/scheduled/cleanup.js',
          name: 'cleanup.js',
          path: 'functions/scheduled/cleanup.js',
          type: 'file',
        },
        {
          id: 'functions/scheduled/sitemap-generator.js',
          name: 'sitemap-generator.js',
          path: 'functions/scheduled/sitemap-generator.js',
          type: 'file',
        },
      ],
    },
  ];
}

function getMockPluginsTree(): FileNode[] {
  return [
    {
      id: 'plugins/seo-optimizer',
      name: 'seo-optimizer',
      path: 'plugins/seo-optimizer',
      type: 'folder',
      children: [
        {
          id: 'plugins/seo-optimizer/plugin.json',
          name: 'plugin.json',
          path: 'plugins/seo-optimizer/plugin.json',
          type: 'file',
        },
        {
          id: 'plugins/seo-optimizer/index.js',
          name: 'index.js',
          path: 'plugins/seo-optimizer/index.js',
          type: 'file',
        },
      ],
    },
    {
      id: 'plugins/social-share',
      name: 'social-share',
      path: 'plugins/social-share',
      type: 'folder',
      children: [
        {
          id: 'plugins/social-share/plugin.json',
          name: 'plugin.json',
          path: 'plugins/social-share/plugin.json',
          type: 'file',
        },
        {
          id: 'plugins/social-share/index.js',
          name: 'index.js',
          path: 'plugins/social-share/index.js',
          type: 'file',
        },
      ],
    },
  ];
}

function getMockAssetsTree(): FileNode[] {
  return [
    {
      id: 'assets/images',
      name: 'images',
      path: 'assets/images',
      type: 'folder',
      children: [
        {
          id: 'assets/images/logo.svg',
          name: 'logo.svg',
          path: 'assets/images/logo.svg',
          type: 'file',
        },
        {
          id: 'assets/images/favicon.ico',
          name: 'favicon.ico',
          path: 'assets/images/favicon.ico',
          type: 'file',
        },
        {
          id: 'assets/images/hero-bg.jpg',
          name: 'hero-bg.jpg',
          path: 'assets/images/hero-bg.jpg',
          type: 'file',
        },
        {
          id: 'assets/images/icons',
          name: 'icons',
          path: 'assets/images/icons',
          type: 'folder',
          children: [
            {
              id: 'assets/images/icons/search.svg',
              name: 'search.svg',
              path: 'assets/images/icons/search.svg',
              type: 'file',
            },
            {
              id: 'assets/images/icons/menu.svg',
              name: 'menu.svg',
              path: 'assets/images/icons/menu.svg',
              type: 'file',
            },
            {
              id: 'assets/images/icons/close.svg',
              name: 'close.svg',
              path: 'assets/images/icons/close.svg',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'assets/fonts',
      name: 'fonts',
      path: 'assets/fonts',
      type: 'folder',
      children: [
        {
          id: 'assets/fonts/inter-regular.woff2',
          name: 'inter-regular.woff2',
          path: 'assets/fonts/inter-regular.woff2',
          type: 'file',
        },
        {
          id: 'assets/fonts/inter-bold.woff2',
          name: 'inter-bold.woff2',
          path: 'assets/fonts/inter-bold.woff2',
          type: 'file',
        },
        {
          id: 'assets/fonts/jetbrains-mono.woff2',
          name: 'jetbrains-mono.woff2',
          path: 'assets/fonts/jetbrains-mono.woff2',
          type: 'file',
        },
      ],
    },
    {
      id: 'assets/uploads',
      name: 'uploads',
      path: 'assets/uploads',
      type: 'folder',
      children: [
        {
          id: 'assets/uploads/2024',
          name: '2024',
          path: 'assets/uploads/2024',
          type: 'folder',
          children: [
            {
              id: 'assets/uploads/2024/post-image-1.jpg',
              name: 'post-image-1.jpg',
              path: 'assets/uploads/2024/post-image-1.jpg',
              type: 'file',
            },
            {
              id: 'assets/uploads/2024/post-image-2.png',
              name: 'post-image-2.png',
              path: 'assets/uploads/2024/post-image-2.png',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'assets/static',
      name: 'static',
      path: 'assets/static',
      type: 'folder',
      children: [
        {
          id: 'assets/static/robots.txt',
          name: 'robots.txt',
          path: 'assets/static/robots.txt',
          type: 'file',
        },
        {
          id: 'assets/static/sitemap.xml',
          name: 'sitemap.xml',
          path: 'assets/static/sitemap.xml',
          type: 'file',
        },
      ],
    },
  ];
}

function getMockCratesTree(): FileNode[] {
  return [
    {
      id: 'crates/rustpress-api',
      name: 'rustpress-api',
      path: 'crates/rustpress-api',
      type: 'folder',
      children: [
        {
          id: 'crates/rustpress-api/Cargo.toml',
          name: 'Cargo.toml',
          path: 'crates/rustpress-api/Cargo.toml',
          type: 'file',
        },
        {
          id: 'crates/rustpress-api/src',
          name: 'src',
          path: 'crates/rustpress-api/src',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-api/src/lib.rs',
              name: 'lib.rs',
              path: 'crates/rustpress-api/src/lib.rs',
              type: 'file',
            },
            {
              id: 'crates/rustpress-api/src/routes.rs',
              name: 'routes.rs',
              path: 'crates/rustpress-api/src/routes.rs',
              type: 'file',
            },
            {
              id: 'crates/rustpress-api/src/handlers.rs',
              name: 'handlers.rs',
              path: 'crates/rustpress-api/src/handlers.rs',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'crates/rustpress-core',
      name: 'rustpress-core',
      path: 'crates/rustpress-core',
      type: 'folder',
      children: [
        {
          id: 'crates/rustpress-core/Cargo.toml',
          name: 'Cargo.toml',
          path: 'crates/rustpress-core/Cargo.toml',
          type: 'file',
        },
        {
          id: 'crates/rustpress-core/src',
          name: 'src',
          path: 'crates/rustpress-core/src',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-core/src/lib.rs',
              name: 'lib.rs',
              path: 'crates/rustpress-core/src/lib.rs',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'crates/rustpress-content',
      name: 'rustpress-content',
      path: 'crates/rustpress-content',
      type: 'folder',
      children: [
        {
          id: 'crates/rustpress-content/Cargo.toml',
          name: 'Cargo.toml',
          path: 'crates/rustpress-content/Cargo.toml',
          type: 'file',
        },
      ],
    },
    {
      id: 'crates/rustpress-auth',
      name: 'rustpress-auth',
      path: 'crates/rustpress-auth',
      type: 'folder',
      children: [
        {
          id: 'crates/rustpress-auth/Cargo.toml',
          name: 'Cargo.toml',
          path: 'crates/rustpress-auth/Cargo.toml',
          type: 'file',
        },
      ],
    },
  ];
}

function getMockRootTree(): FileNode[] {
  return [
    {
      id: 'Cargo.toml',
      name: 'Cargo.toml',
      path: 'Cargo.toml',
      type: 'file',
    },
    {
      id: 'Cargo.lock',
      name: 'Cargo.lock',
      path: 'Cargo.lock',
      type: 'file',
    },
    {
      id: '.env',
      name: '.env',
      path: '.env',
      type: 'file',
    },
    {
      id: 'docker-compose.yml',
      name: 'docker-compose.yml',
      path: 'docker-compose.yml',
      type: 'file',
    },
    {
      id: 'init_db.sql',
      name: 'init_db.sql',
      path: 'init_db.sql',
      type: 'file',
    },
    {
      id: 'config',
      name: 'config',
      path: 'config',
      type: 'folder',
      children: [
        {
          id: 'config/rustpress.toml',
          name: 'rustpress.toml',
          path: 'config/rustpress.toml',
          type: 'file',
        },
      ],
    },
    {
      id: 'crates',
      name: 'crates',
      path: 'crates',
      type: 'folder',
      children: [
        {
          id: 'crates/rustpress-api',
          name: 'rustpress-api',
          path: 'crates/rustpress-api',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-api/Cargo.toml',
              name: 'Cargo.toml',
              path: 'crates/rustpress-api/Cargo.toml',
              type: 'file',
            },
            {
              id: 'crates/rustpress-api/src',
              name: 'src',
              path: 'crates/rustpress-api/src',
              type: 'folder',
              children: [
                {
                  id: 'crates/rustpress-api/src/lib.rs',
                  name: 'lib.rs',
                  path: 'crates/rustpress-api/src/lib.rs',
                  type: 'file',
                },
              ],
            },
          ],
        },
        {
          id: 'crates/rustpress-core',
          name: 'rustpress-core',
          path: 'crates/rustpress-core',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-core/Cargo.toml',
              name: 'Cargo.toml',
              path: 'crates/rustpress-core/Cargo.toml',
              type: 'file',
            },
            {
              id: 'crates/rustpress-core/src',
              name: 'src',
              path: 'crates/rustpress-core/src',
              type: 'folder',
              children: [
                {
                  id: 'crates/rustpress-core/src/lib.rs',
                  name: 'lib.rs',
                  path: 'crates/rustpress-core/src/lib.rs',
                  type: 'file',
                },
              ],
            },
          ],
        },
        {
          id: 'crates/rustpress-content',
          name: 'rustpress-content',
          path: 'crates/rustpress-content',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-content/Cargo.toml',
              name: 'Cargo.toml',
              path: 'crates/rustpress-content/Cargo.toml',
              type: 'file',
            },
          ],
        },
        {
          id: 'crates/rustpress-auth',
          name: 'rustpress-auth',
          path: 'crates/rustpress-auth',
          type: 'folder',
          children: [
            {
              id: 'crates/rustpress-auth/Cargo.toml',
              name: 'Cargo.toml',
              path: 'crates/rustpress-auth/Cargo.toml',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'themes',
      name: 'themes',
      path: 'themes',
      type: 'folder',
      children: [
        {
          id: 'themes/rustpress-developer',
          name: 'rustpress-developer',
          path: 'themes/rustpress-developer',
          type: 'folder',
          children: [
            {
              id: 'themes/rustpress-developer/theme.json',
              name: 'theme.json',
              path: 'themes/rustpress-developer/theme.json',
              type: 'file',
            },
            {
              id: 'themes/rustpress-developer/templates',
              name: 'templates',
              path: 'themes/rustpress-developer/templates',
              type: 'folder',
              children: [
                {
                  id: 'themes/rustpress-developer/templates/home.html',
                  name: 'home.html',
                  path: 'themes/rustpress-developer/templates/home.html',
                  type: 'file',
                },
                {
                  id: 'themes/rustpress-developer/templates/post.html',
                  name: 'post.html',
                  path: 'themes/rustpress-developer/templates/post.html',
                  type: 'file',
                },
              ],
            },
            {
              id: 'themes/rustpress-developer/assets',
              name: 'assets',
              path: 'themes/rustpress-developer/assets',
              type: 'folder',
              children: [
                {
                  id: 'themes/rustpress-developer/assets/css',
                  name: 'css',
                  path: 'themes/rustpress-developer/assets/css',
                  type: 'folder',
                  children: [
                    {
                      id: 'themes/rustpress-developer/assets/css/style.css',
                      name: 'style.css',
                      path: 'themes/rustpress-developer/assets/css/style.css',
                      type: 'file',
                    },
                  ],
                },
                {
                  id: 'themes/rustpress-developer/assets/js',
                  name: 'js',
                  path: 'themes/rustpress-developer/assets/js',
                  type: 'folder',
                  children: [
                    {
                      id: 'themes/rustpress-developer/assets/js/main.js',
                      name: 'main.js',
                      path: 'themes/rustpress-developer/assets/js/main.js',
                      type: 'file',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'plugins',
      name: 'plugins',
      path: 'plugins',
      type: 'folder',
      children: [],
    },
    {
      id: 'migrations',
      name: 'migrations',
      path: 'migrations',
      type: 'folder',
      children: [],
    },
    {
      id: 'admin-ui',
      name: 'admin-ui',
      path: 'admin-ui',
      type: 'folder',
      children: [
        {
          id: 'admin-ui/package.json',
          name: 'package.json',
          path: 'admin-ui/package.json',
          type: 'file',
        },
        {
          id: 'admin-ui/vite.config.ts',
          name: 'vite.config.ts',
          path: 'admin-ui/vite.config.ts',
          type: 'file',
        },
        {
          id: 'admin-ui/src',
          name: 'src',
          path: 'admin-ui/src',
          type: 'folder',
          children: [
            {
              id: 'admin-ui/src/App.tsx',
              name: 'App.tsx',
              path: 'admin-ui/src/App.tsx',
              type: 'file',
            },
            {
              id: 'admin-ui/src/main.tsx',
              name: 'main.tsx',
              path: 'admin-ui/src/main.tsx',
              type: 'file',
            },
          ],
        },
      ],
    },
  ];
}

function getMockFileContent(path: string): FileContent {
  // Check localStorage first
  const stored = localStorage.getItem(`rustpress_file_${path}`);
  if (stored) {
    return {
      path,
      content: stored,
      encoding: 'utf-8',
      language: getLanguageFromPath(path),
      size: stored.length,
      modified: new Date().toISOString(),
    };
  }

  // Return placeholder content based on file type
  const ext = path.split('.').pop()?.toLowerCase();
  let content = '';

  switch (ext) {
    case 'rs':
      content = `// ${path}\n// Rust source file\n\nfn main() {\n    println!("Hello, RustPress!");\n}\n`;
      break;
    case 'toml':
      content = `# ${path}\n# TOML configuration file\n\n[package]\nname = "example"\nversion = "0.1.0"\n`;
      break;
    case 'json':
      content = `{\n  "name": "${path}",\n  "version": "1.0.0"\n}\n`;
      break;
    case 'html':
      content = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${path}</title>\n</head>\n<body>\n  <!-- Content -->\n</body>\n</html>\n`;
      break;
    case 'css':
      content = `/* ${path} */\n\nbody {\n  margin: 0;\n  padding: 0;\n}\n`;
      break;
    case 'js':
    case 'ts':
      content = `// ${path}\n\nconsole.log('Hello from ${path}');\n`;
      break;
    case 'tsx':
    case 'jsx':
      content = `// ${path}\n\nimport React from 'react';\n\nexport default function Component() {\n  return <div>Hello</div>;\n}\n`;
      break;
    case 'sql':
      content = `-- ${path}\n-- SQL file\n\nSELECT * FROM posts;\n`;
      break;
    case 'yml':
    case 'yaml':
      content = `# ${path}\n# YAML configuration\n\nversion: '3'\nservices: {}\n`;
      break;
    default:
      content = `# ${path}\n`;
  }

  return {
    path,
    content,
    encoding: 'utf-8',
    language: getLanguageFromPath(path),
    size: content.length,
    modified: new Date().toISOString(),
  };
}

export default {
  listDirectory,
  readFile,
  writeFile,
  createFile,
  deleteFile,
  renameFile,
  getLanguageFromPath,
};
