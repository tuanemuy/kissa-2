"use client";

import { Clock, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface BusinessHour {
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

interface BusinessHoursFormProps {
  value: BusinessHour[];
  onChange: (businessHours: BusinessHour[]) => void;
  className?: string;
}

const weekDays = [
  { value: "monday", label: "月曜日" },
  { value: "tuesday", label: "火曜日" },
  { value: "wednesday", label: "水曜日" },
  { value: "thursday", label: "木曜日" },
  { value: "friday", label: "金曜日" },
  { value: "saturday", label: "土曜日" },
  { value: "sunday", label: "日曜日" },
];

// Generate time options (30-minute intervals)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      times.push(time);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export function BusinessHoursForm({
  value,
  onChange,
  className = "",
}: BusinessHoursFormProps) {
  const [isExpanded, setIsExpanded] = useState(value.length > 0);

  // Initialize with all weekdays if empty
  const initializeBusinessHours = () => {
    const defaultHours: BusinessHour[] = weekDays.map((day) => ({
      dayOfWeek: day.value,
      openTime: "09:00",
      closeTime: "18:00",
      isClosed: false,
    }));
    onChange(defaultHours);
    setIsExpanded(true);
  };

  // Update a specific day's hours
  const updateBusinessHour = (
    dayOfWeek: string,
    updates: Partial<BusinessHour>,
  ) => {
    const newBusinessHours = value.map((hour) =>
      hour.dayOfWeek === dayOfWeek ? { ...hour, ...updates } : hour,
    );
    onChange(newBusinessHours);
  };

  // Copy hours from another day
  const copyFromDay = (targetDay: string, sourceDay: string) => {
    const sourceHour = value.find((hour) => hour.dayOfWeek === sourceDay);
    if (sourceHour) {
      updateBusinessHour(targetDay, {
        openTime: sourceHour.openTime,
        closeTime: sourceHour.closeTime,
        isClosed: sourceHour.isClosed,
      });
    }
  };

  // Apply same hours to all days
  const applyToAllDays = () => {
    if (value.length === 0) return;

    const firstDay = value[0];
    const updatedHours = value.map((hour) => ({
      ...hour,
      openTime: firstDay.openTime,
      closeTime: firstDay.closeTime,
      isClosed: firstDay.isClosed,
    }));
    onChange(updatedHours);
  };

  // Clear all business hours
  const clearAllHours = () => {
    onChange([]);
    setIsExpanded(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!isExpanded || value.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">営業時間を設定</p>
                <p className="text-sm text-muted-foreground">
                  お客様に正確な営業時間をお知らせしましょう
                </p>
              </div>
              <Button onClick={initializeBusinessHours} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                営業時間を追加
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                営業時間
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={applyToAllDays} size="sm" variant="outline">
                  全日に適用
                </Button>
                <Button
                  onClick={clearAllHours}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekDays.map((day) => {
              const businessHour = value.find(
                (hour) => hour.dayOfWeek === day.value,
              ) || {
                dayOfWeek: day.value,
                openTime: "09:00",
                closeTime: "18:00",
                isClosed: false,
              };

              return (
                <div
                  key={day.value}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border rounded-lg"
                >
                  {/* Day name */}
                  <div className="md:col-span-1">
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  {/* Closed switch */}
                  <div className="md:col-span-1 flex items-center space-x-2">
                    <Switch
                      checked={!businessHour.isClosed}
                      onCheckedChange={(checked) =>
                        updateBusinessHour(day.value, { isClosed: !checked })
                      }
                    />
                    <Label className="text-sm">
                      {businessHour.isClosed ? "定休日" : "営業"}
                    </Label>
                  </div>

                  {/* Open time */}
                  <div className="md:col-span-1">
                    <Select
                      value={businessHour.openTime || "09:00"}
                      onValueChange={(value) =>
                        updateBusinessHour(day.value, { openTime: value })
                      }
                      disabled={businessHour.isClosed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Separator */}
                  <div className="md:col-span-1 text-center">
                    <span className="text-muted-foreground">〜</span>
                  </div>

                  {/* Close time */}
                  <div className="md:col-span-1">
                    <Select
                      value={businessHour.closeTime || "18:00"}
                      onValueChange={(value) =>
                        updateBusinessHour(day.value, { closeTime: value })
                      }
                      disabled={businessHour.isClosed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Copy from dropdown */}
                  <div className="md:col-span-1">
                    <Select
                      value=""
                      onValueChange={(sourceDay) =>
                        copyFromDay(day.value, sourceDay)
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="コピー" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays
                          .filter((otherDay) => otherDay.value !== day.value)
                          .map((otherDay) => (
                            <SelectItem
                              key={otherDay.value}
                              value={otherDay.value}
                            >
                              {otherDay.label}から
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            {/* Quick templates */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">
                クイック設定
              </Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const standardHours = weekDays.map((day) => ({
                      dayOfWeek: day.value,
                      openTime: "09:00",
                      closeTime: "18:00",
                      isClosed: day.value === "sunday",
                    }));
                    onChange(standardHours);
                  }}
                >
                  平日営業
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const allDayHours = weekDays.map((day) => ({
                      dayOfWeek: day.value,
                      openTime: "00:00",
                      closeTime: "23:59",
                      isClosed: false,
                    }));
                    onChange(allDayHours);
                  }}
                >
                  24時間営業
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const restaurantHours = weekDays.map((day) => ({
                      dayOfWeek: day.value,
                      openTime: "11:00",
                      closeTime: "22:00",
                      isClosed: day.value === "monday",
                    }));
                    onChange(restaurantHours);
                  }}
                >
                  レストラン
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
