import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
	configuration: {
		pageTitle: "ravig31.github.io",
		pageTitleSuffix: "ravig31",
		enableSPA: true,
		enablePopovers: true,
		analytics: {
			provider: "plausible",
		},
		locale: "en-US",
		baseUrl: "ravig31.github.io",
		ignorePatterns: ["private", "templates", ".obsidian"],
		defaultDateType: "modified",
		theme: {
			fontOrigin: "googleFonts",
			cdnCaching: true,
			typography: {
				header: {
					name: "DM Serif Display",
					weights: [400],
				},
				body: "Bricolage Grotesque",
				code: "JetBrains Mono",
			},
			colors: {
				lightMode: {
					light: "#f7f4ec",         // Background
					lightgray: "#e5e0d4",     // Lighter accent
					gray: "#b9b2a7",          // Medium gray
					darkgray: "#635e59ff",      // Darker gray
					dark: "#454b56",          // Main text color
					secondary: "#506f7f",     // Secondary accent color
					tertiary: "#887e74",      // Tertiary accent color
					highlight: "#e9dcd0",     // Soft gold highlight background
					textHighlight: "#d4c47e88", // A pale, soft gold for text
				},
				darkMode: {
					light: "#1e242c",         // Deep background
					lightgray: "#2c343e",     // Lighter accent
					gray: "#4c5563",          // Medium gray
					darkgray: "#b6bec6ff",      // Darker gray
					dark: "#c2cbd4",          // Main text color
					secondary: "#85a1b3",     // Secondary accent color
					tertiary: "#77787aff",      // Tertiary accent color
					highlight: "#2e3a47",     // Highlight background (remains)
					textHighlight: "#d1b57088", // A soft gold for text highlights
				},
			},
		},
	},
	plugins: {
		transformers: [
			Plugin.FrontMatter(),
			Plugin.CreatedModifiedDate({
				priority: ["frontmatter", "git", "filesystem"],
			}),
			Plugin.SyntaxHighlighting({
				theme: {
					light: "github-light",
					dark: "github-dark",
				},
				keepBackground: false,
			}),
			Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
			Plugin.GitHubFlavoredMarkdown(),
			Plugin.TableOfContents(),
			Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
			Plugin.Description(),
			Plugin.Latex({ renderEngine: "katex" }),
		],
		filters: [Plugin.RemoveDrafts()],
		emitters: [
			Plugin.AliasRedirects(),
			Plugin.ComponentResources(),
			Plugin.ContentPage(),
			Plugin.FolderPage(),
			Plugin.TagPage(),
			Plugin.ContentIndex({
				enableSiteMap: true,
				enableRSS: true,
			}),
			Plugin.Assets(),
			Plugin.Static(),
			Plugin.Favicon(),
			Plugin.NotFoundPage(),
			// Comment out CustomOgImages to speed up build time
			Plugin.CustomOgImages(),
		],
	},
}

export default config
