import { Stepper, StepperStep } from "@mantine/core";
import { PIPELINE_STAGES } from "@/config/pipeline";

export function PipelineRail({ active }: { active: number }) {
  return (
    <Stepper active={active - 1} size="xs" allowNextStepsSelect={false}>
      {PIPELINE_STAGES.map((s) => (
        <StepperStep key={s.step} label={s.label} description={s.optional ? "Optional" : undefined} />
      ))}
    </Stepper>
  );
}
