import { afterEach, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CourseNextCourses from "../app/components/CourseNextCourses.vue";

const wrappers: Array<{ unmount: () => void }> = [];
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()));

it("renders accessible successor links with host labels and hides an empty section", async () => {
  const wrapper = await mountSuspended(CourseNextCourses, { props: {
    courses: [], title: "So geht’s weiter", courseLabel: "Nächster Kurs", linkLabel: "Zum Kurs"
  } });
  wrappers.push(wrapper);
  expect(wrapper.find('section').exists()).toBe(false);
  await wrapper.setProps({ courses: [
    { path: '/first', title: 'First', description: 'Learn the basics' },
    { path: '/second', title: 'Second', description: 'Build a project' }
  ] });
  expect(wrapper.get('section').attributes('aria-label')).toBe('So geht’s weiter');
  expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual(['/first', '/second']);
  expect(wrapper.text()).toContain('Nächster Kurs');
  expect(wrapper.text()).toContain('Learn the basics');
  expect(wrapper.text()).toContain('Zum Kurs');
  await wrapper.setProps({ courses: [{ path: '/first', title: 'Updated title', description: 'Updated description' }] });
  expect(wrapper.findAll('a')).toHaveLength(1);
  expect(wrapper.text()).toContain('Updated title');
});
