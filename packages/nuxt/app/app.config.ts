export default defineAppConfig({
  variants: {
    courseMetadata: {
      config: {
        courseMetadata: {
          dateLocale: "en-US",
          draftLabel: "Draft"
        }
      }
    },
    courseInputs: {
      config: {
        courseInputs: {
          enabled: true
        }
      }
    },
    courseNavigation: {
      config: {
        courseNavigation: {
          overviewLabel: "Overview",
          outlineLabel: "Course outline",
          breadcrumbs: {
            label: "Courses",
            to: "/courses",
            icon: "i-lucide-square-library"
          }
        }
      }
    },
    courseProgress: {
      config: {
        courseProgress: {
          storagePrefix: "course-progress"
        }
      }
    },
    courseCodeStage: {
      config: {
        courseCodeStage: {
          label: "Project files",
          emptyLabel: "Scroll to a code step to inspect the project.",
          minTreeWidth: 220,
          maxTreeWidth: 520,
          minCodeWidth: 360,
          defaultTreeWidth: 288
        }
      }
    },
    courseFileTree: {
      config: {
        courseFileTree: {
          expandAll: true
        }
      }
    }
  }
});
