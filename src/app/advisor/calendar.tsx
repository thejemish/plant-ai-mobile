import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import {
  currentUserId,
  loadCalendarTasks,
  scheduleCalendarReminder,
  type CalendarTask,
} from "@/features/advisor/service";
import { useActionsStore } from "@/store/use-actions";
import { Button, Card, EmptyState, Pill } from "@/ui";

export default function CalendarRoute() {
  const actions = useActionsStore((state) => state.actions);
  const hydrateActions = useActionsStore((state) => state.hydrateActions);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [scheduling, setScheduling] = useState<string | null>(null);

  useEffect(() => {
    void loadCalendarTasks().then(setTasks);
    void hydrateActions();
  }, [hydrateActions]);

  const scheduledKeys = useMemo(
    () => new Set(actions.filter((action) => action.scheduled_for).map((action) => action.step_key)),
    [actions],
  );

  const schedule = async (task: CalendarTask) => {
    const userId = await currentUserId();
    if (!userId) {
      Alert.alert("Sign in required", "Start a guest session before scheduling reminders.");
      return;
    }

    setScheduling(task.id);
    try {
      const result = await scheduleCalendarReminder({ task, userId });
      Alert.alert("Reminder scheduled", `Plant-AI will remind you on ${new Date(result.scheduledAt).toLocaleString()}.`);
    } catch (error) {
      Alert.alert("Reminder failed", error instanceof Error ? error.message : "Could not schedule this reminder.");
    } finally {
      setScheduling(null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Calendar</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Crop calendar</Text>
      <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
        Tasks are matched from crop stage rules for your active fields.
      </Text>

      <View className="mt-6 gap-3">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const stepKey = `calendar:${task.id}`;
            const scheduled = scheduledKeys.has(stepKey);
            return (
              <Card key={task.id}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{task.fieldName}</Text>
                    <Text className="mt-1 text-sm text-foreground-secondary">{task.label}</Text>
                  </View>
                  {scheduled ? <Pill tone="success">Scheduled</Pill> : <Pill>{task.stage}</Pill>}
                </View>
                <View className="mt-4 flex-row items-center justify-between gap-3">
                  <Text className="text-xs font-semibold uppercase text-foreground-tertiary">
                    {task.crop ?? "Crop"} · days {task.dayStart}-{task.dayEnd}
                  </Text>
                  {scheduled ? (
                    <Pressable className="h-10 items-center justify-center rounded-xl border border-border-strong px-4" disabled>
                      <Text className="text-sm font-semibold text-foreground-secondary">Reminder set</Text>
                    </Pressable>
                  ) : (
                    <Button
                      className="h-10 px-4"
                      icon={<Ionicons className="text-primary-on" name="notifications-outline" size={18} />}
                      loading={scheduling === task.id}
                      onPress={() => schedule(task)}
                    >
                      Remind
                    </Button>
                  )}
                </View>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={<Ionicons className="text-primary" name="calendar-outline" size={36} />}
            title="No active tasks"
            body="Add a field with crop and sowing date so stage-based tasks can appear here."
          />
        )}
      </View>
    </ScrollView>
  );
}
