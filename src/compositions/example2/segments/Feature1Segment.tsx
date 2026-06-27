import { ContentSlide } from "../../../components/ContentSlide";
import { CONTENT } from "../content";

export const Feature1Segment: React.FC = () => {
  return (
    <ContentSlide
      header={CONTENT.feature1Header}
      content={CONTENT.feature1Content}
    />
  );
};
