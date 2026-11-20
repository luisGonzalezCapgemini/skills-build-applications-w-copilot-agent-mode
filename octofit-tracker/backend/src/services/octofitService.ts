import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || !mongoose.isValidObjectId(userId)
    || !mongoose.isValidObjectId(teamId)
    || typeof type !== 'string'
    || type.trim().length === 0
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (
    typeof name !== 'string'
    || name.trim().length === 0
    || typeof mascot !== 'string'
    || mascot.trim().length === 0
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw Object.assign(new Error('Invalid team members'), { status: 400 });
  }

  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('Team member not found'), { status: 404 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
  ]);

  return entries.map((entry, index) => ({
    teamName: entry.team.name,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const activities = await Activity.find({ user: user._id }).lean();
  const activityTypes = new Set(activities.map((activity) => activity.type));
  const focus = activityTypes.has('run')
    ? 'endurance'
    : activityTypes.has('strength')
      ? 'strength'
      : user.fitnessGoal;

  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: `Matched to ${focus} based on your ${activityTypes.size > 0 ? [...activityTypes].join(', ') : focus} activity.`,
  }));
}

export { User };
