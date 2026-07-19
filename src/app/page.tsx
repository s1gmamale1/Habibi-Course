import { loadCourse } from "@/content/load";
import { CourseMap } from "@/components/ProgressClient";

export default function Home() {
  return <CourseMap course={loadCourse()} />;
}
