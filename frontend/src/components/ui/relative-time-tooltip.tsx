import {
	RelativeTime,
	RelativeTimeZone,
	RelativeTimeZoneDate,
	RelativeTimeZoneDisplay,
	RelativeTimeZoneLabel,
} from "./kibo-ui/relative-time";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru"; // ES 2015

dayjs.extend(relativeTime);
dayjs.locale("ru");

export function RelativeTimeTooltip({
	date,
	relative = false,
}: { date: Date; relative?: boolean }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span>
					{relative
						? dayjs(date).fromNow()
						: dayjs(date).format("DD.MM.YYYY HH:mm")}
				</span>
			</TooltipTrigger>
			<TooltipContent className="bg-card text-card-foreground [&_svg]:bg-card [&_svg]:fill-card border">
				<RelativeTime time={date}>
					<RelativeTimeZone zone={"Europe/London"}>
						<RelativeTimeZoneLabel>UTC</RelativeTimeZoneLabel>
						<RelativeTimeZoneDate />
						<RelativeTimeZoneDisplay />
					</RelativeTimeZone>
					<RelativeTimeZone zone={"Europe/Moscow"}>
						<RelativeTimeZoneLabel>MSK</RelativeTimeZoneLabel>
						<RelativeTimeZoneDate />
						<RelativeTimeZoneDisplay />
					</RelativeTimeZone>
				</RelativeTime>
			</TooltipContent>
		</Tooltip>
	);
}
